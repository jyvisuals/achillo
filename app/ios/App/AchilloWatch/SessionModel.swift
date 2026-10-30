import Foundation
import SwiftUI
import WatchConnectivity
import WatchKit

// One step of the phone's session timeline: kind is setup / up / hold / down / rest / mark.
struct WStep {
    let kind: String
    let secs: Double
    let ex: Int
    let rep: Int
    let label: String
}

// One exercise (a set): reps per set, which set of how many, and whether it's a rest block.
struct WEx {
    let name: String
    let reps: Int
    let set: Int
    let sets: Int
    let rest: Bool
}

final class SessionModel: NSObject, ObservableObject {
    static let shared = SessionModel()

    @Published var active = false
    @Published var paused = false
    @Published var title = "Achilló"
    @Published var tick = Date()
    @Published var phoneReachable = false
    @Published var finished: String? = nil

    private(set) var steps: [WStep] = []
    private(set) var exs: [WEx] = []
    private var offsets: [Double] = []
    private var basePos: Double = 0
    private var baseAt = Date()
    private var lastIndex = -1
    private var lastSecond = -1
    private var timer: Timer?
    private var runtime: WKExtendedRuntimeSession?

    struct Now {
        let index: Int
        let step: WStep
        let ex: WEx
        let left: Double
        let frac: Double
        let next: String?
    }

    override init() {
        super.init()
        if WCSession.isSupported() {
            WCSession.default.delegate = self
            WCSession.default.activate()
        }
    }

    // MARK: timeline

    var position: Double { paused ? basePos : basePos + Date().timeIntervalSince(baseAt) }
    var total: Double { (offsets.last ?? 0) + max(0, steps.last?.secs ?? 0) }

    private func index(at p: Double) -> Int {
        var lo = 0, hi = steps.count - 1, ans = 0
        while lo <= hi {
            let mid = (lo + hi) / 2
            if offsets[mid] <= p { ans = mid; lo = mid + 1 } else { hi = mid - 1 }
        }
        var i = ans
        while i < steps.count - 1 && steps[i].secs <= 0 { i += 1 }
        return i
    }

    func current() -> Now? {
        guard active, !steps.isEmpty else { return nil }
        let p = position
        if p >= total { return nil }
        let i = index(at: p)
        let s = steps[i]
        let into = p - offsets[i]
        let left = max(0, s.secs - into)
        let frac = s.secs > 0 ? min(1, max(0, into / s.secs)) : 1
        return Now(index: i, step: s, ex: exs[s.ex], left: left, frac: frac, next: nextName(after: i))
    }

    private func nextName(after i: Int) -> String? {
        let cur = steps[i].ex
        var j = i + 1
        while j < steps.count {
            let e = exs[steps[j].ex]
            if steps[j].ex != cur && !e.rest { return e.set > 1 || e.sets > 1 ? "\(e.name) · \(e.set) of \(e.sets)" : e.name }
            j += 1
        }
        return nil
    }

    // How hard to push right now, 0...1: swells on the way up, fades on the way down, steady on a hold.
    func effort(_ n: Now) -> Double {
        switch n.step.kind {
        case "up": return 0.25 + 0.75 * n.frac
        case "down": return max(0, 1 - 0.9 * n.frac)
        case "hold": return 0.85 + 0.15 * sin(Date().timeIntervalSinceReferenceDate * 2.6)
        default: return 0
        }
    }

    // MARK: running

    private func startTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in self?.advance() }
    }

    private func advance() {
        tick = Date()
        guard active, !paused else { return }
        if position >= total { finish(complete: true); return }
        guard let n = current() else { return }
        if n.index != lastIndex {
            let prev = lastIndex
            lastIndex = n.index
            lastSecond = -1
            buzz(for: n, prev: prev)
        }
        let sec = Int(ceil(n.left))
        if sec != lastSecond {
            lastSecond = sec
            let k = n.step.kind
            if (k == "rest" || k == "setup") && n.step.secs >= 6 && sec >= 1 && sec <= 3 { play(.click) }
            if k == "hold" && n.step.secs >= 8 && sec >= 1 && sec <= 3 { play(.click) }
            if k == "hold" && n.step.secs >= 20 && sec > 3 && sec % 10 == 0 && Double(sec) < n.step.secs - 1 { play(.click) }
        }
    }

    private func buzz(for n: Now, prev: Int) {
        let s = n.step
        let newExercise = prev >= 0 && steps[prev].ex != s.ex && !n.ex.rest
        let firstPhaseOfRep = n.index == 0 || steps[n.index - 1].rep != s.rep || steps[n.index - 1].ex != s.ex
        if newExercise && s.kind == "setup" { play(.notification); return }
        switch s.kind {
        case "up":
            play(firstPhaseOfRep && n.ex.reps > 1 && s.rep == n.ex.reps - 1 ? .notification : .directionUp)
        case "down": play(.directionDown)
        case "hold": play(firstPhaseOfRep && n.ex.reps > 1 && s.rep == n.ex.reps - 1 ? .notification : .start)
        case "rest": play(.stop)
        case "setup": play(.retry)
        default: break
        }
    }

    private func play(_ t: WKHapticType) { WKInterfaceDevice.current().play(t) }

    private func finish(complete: Bool) {
        guard active else { return }
        active = false
        paused = false
        finished = complete ? "Round done" : "Session ended"
        if complete { play(.success) }
        stopRuntime()
    }

    // MARK: controls (sent to the phone too)

    func pause() {
        guard active, !paused else { return }
        basePos = position; baseAt = Date(); paused = true
        play(.click)
        sendCmd("pause")
    }

    func resume() {
        guard active, paused else { return }
        baseAt = Date(); paused = false; lastSecond = -1
        play(.click)
        sendCmd("play")
    }

    // Same as the phone's skip: past this set (and the rest after it); during a rest or setup, just past the wait.
    func skip() {
        guard let n = current() else { return }
        let s = n.step
        var j = n.index + 1
        let waiting = s.kind == "setup" || s.kind == "rest" || n.ex.rest
        if !waiting {
            while j < steps.count && (steps[j].ex == s.ex || exs[steps[j].ex].rest || steps[j].secs <= 0) { j += 1 }
        }
        basePos = j < steps.count ? offsets[j] : total
        baseAt = Date()
        lastIndex = -1
        sendCmd("skip")
    }

    func end() {
        sendCmd("end")
        finish(complete: false)
    }

    func start(_ mode: String) { sendCmd("start", ["mode": mode]) }

    func sendCmd(_ c: String, _ extra: [String: Any] = [:]) {
        var m: [String: Any] = ["cmd": c]
        for (k, v) in extra { m[k] = v }
        let s = WCSession.default
        guard s.activationState == .activated, s.isReachable else { return }
        s.sendMessage(m, replyHandler: nil, errorHandler: nil)
    }

    // MARK: plans from the phone

    private func num(_ x: Any?) -> Double {
        if let n = x as? NSNumber { return n.doubleValue }
        if let d = x as? Double { return d }
        if let i = x as? Int { return Double(i) }
        return 0
    }

    fileprivate func receive(_ d: [String: Any]) {
        guard let json = d["json"] as? String, let data = json.data(using: .utf8),
              let o = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else { return }
        DispatchQueue.main.async { self.apply(o) }
    }

    private func apply(_ d: [String: Any]) {
        let type = d["type"] as? String ?? ""
        if type == "end" { finish(complete: (d["complete"] as? Bool) ?? false); return }
        guard type == "plan" else { return }
        let at = Date(timeIntervalSince1970: num(d["at"]) / 1000)
        if let st = d["steps"] as? [[Any]] {
            let newSteps = st.map { a in
                WStep(kind: a.count > 0 ? (a[0] as? String ?? "") : "",
                      secs: a.count > 1 ? num(a[1]) : 0,
                      ex: a.count > 2 ? Int(num(a[2])) : 0,
                      rep: a.count > 3 ? Int(num(a[3])) : 0,
                      label: a.count > 4 ? (a[4] as? String ?? "") : "")
            }
            let changed = newSteps.count != steps.count
            steps = newSteps
            if changed { lastIndex = -1 }
        }
        if let ex = d["ex"] as? [[Any]] {
            exs = ex.map { a in
                WEx(name: a.count > 0 ? (a[0] as? String ?? "") : "",
                    reps: max(1, a.count > 1 ? Int(num(a[1])) : 1),
                    set: max(1, a.count > 2 ? Int(num(a[2])) : 1),
                    sets: max(1, a.count > 3 ? Int(num(a[3])) : 1),
                    rest: a.count > 4 ? num(a[4]) > 0 : false)
            }
        }
        var t = 0.0
        offsets = steps.map { s in let o = t; t += max(0, s.secs); return o }
        title = d["title"] as? String ?? "Achilló"
        let wasPaused = paused
        paused = (d["paused"] as? Bool) ?? false
        basePos = num(d["pos"])
        baseAt = paused ? Date() : at
        if paused != wasPaused { lastSecond = -1 }
        if steps.isEmpty || exs.isEmpty || position >= total { active = false; return }
        if !active {
            active = true
            finished = nil
            lastIndex = -1
            startRuntime()
            startTimer()
        }
    }
}

// MARK: WatchConnectivity

extension SessionModel: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        let ctx = session.receivedApplicationContext
        DispatchQueue.main.async { self.phoneReachable = session.isReachable }
        if !ctx.isEmpty { receive(ctx) }
    }
    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async { self.phoneReachable = session.isReachable }
    }
    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) { receive(message) }
    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) { receive(applicationContext) }
}

// MARK: keep running with your wrist down (a physical-therapy session)

extension SessionModel: WKExtendedRuntimeSessionDelegate {
    fileprivate func startRuntime() {
        if let r = runtime, r.state == .running || r.state == .scheduled { return }
        let r = WKExtendedRuntimeSession()
        r.delegate = self
        r.start()
        runtime = r
    }
    fileprivate func stopRuntime() {
        runtime?.invalidate()
        runtime = nil
    }
    func extendedRuntimeSession(_ extendedRuntimeSession: WKExtendedRuntimeSession, didInvalidateWith reason: WKExtendedRuntimeSessionInvalidationReason, error: Error?) {
        DispatchQueue.main.async { if self.runtime === extendedRuntimeSession { self.runtime = nil } }
    }
    func extendedRuntimeSessionDidStart(_ extendedRuntimeSession: WKExtendedRuntimeSession) {}
    func extendedRuntimeSessionWillExpire(_ extendedRuntimeSession: WKExtendedRuntimeSession) {}
}
