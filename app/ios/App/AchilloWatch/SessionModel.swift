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
    // Tap strength: 0 normal, 1 strong (default), 2 max.
    @Published var strength: Int = UserDefaults.standard.object(forKey: "tapStrength") as? Int ?? 1 {
        didSet { UserDefaults.standard.set(strength, forKey: "tapStrength") }
    }
    // Textures: ticks that speed up on the rise, slow on the lower, and a heartbeat on holds.
    @Published var textures: Bool = UserDefaults.standard.object(forKey: "tapTextures") as? Bool ?? true {
        didSet { UserDefaults.standard.set(textures, forKey: "tapTextures") }
    }
    private var nextTexAt: Double = 0

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
            nextTexAt = 0.5   // let the start cue land first
            buzz(for: n, prev: prev)
        }
        texture(n)
        let sec = Int(ceil(n.left))
        if sec != lastSecond {
            lastSecond = sec
            let k = n.step.kind
            if (k == "rest" || k == "setup") && n.step.secs >= 6 && sec >= 1 && sec <= 3 { cue(.countdown) }
            if k == "hold" && n.step.secs >= 8 && sec >= 1 && sec <= 3 { cue(.countdown) }
            if !textures && k == "hold" && n.step.secs >= 20 && sec > 3 && sec % 10 == 0 && Double(sec) < n.step.secs - 1 { cue(.holdTick) }
        }
    }

    // Rise: gaps shrink 0.7 → 0.2 s. Lower: gaps grow 0.2 → 0.75 s. Hold: lub-dub every couple of seconds,
    // handing over to the countdown taps for the last 3 s.
    private func texture(_ n: Now) {
        guard textures else { return }
        let k = n.step.kind
        guard k == "up" || k == "down" || k == "hold" else { return }
        let elapsed = n.step.secs - n.left
        guard elapsed >= nextTexAt, n.left > 0.25 else { return }
        let firm: WKHapticType = strength == 0 ? .click : .start
        switch k {
        case "up":
            WKInterfaceDevice.current().play(firm)
            nextTexAt = elapsed + max(0.2, 0.7 - 0.5 * n.frac)
        case "down":
            WKInterfaceDevice.current().play(firm)
            nextTexAt = elapsed + 0.2 + 0.55 * n.frac
        default:
            if n.step.secs >= 8 && n.left <= 3.2 { nextTexAt = n.step.secs; return }
            WKInterfaceDevice.current().play(firm)
            if strength > 0 { DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) { WKInterfaceDevice.current().play(.click) } }
            nextTexAt = elapsed + [3.0, 2.0, 1.5][min(2, max(0, strength))]
        }
    }

    private func buzz(for n: Now, prev: Int) {
        let s = n.step
        let newExercise = prev >= 0 && steps[prev].ex != s.ex && !n.ex.rest
        let firstPhaseOfRep = n.index == 0 || steps[n.index - 1].rep != s.rep || steps[n.index - 1].ex != s.ex
        let lastRep = firstPhaseOfRep && n.ex.reps > 1 && s.rep == n.ex.reps - 1
        if newExercise && s.kind == "setup" { cue(.newExercise); return }
        switch s.kind {
        case "up": cue(lastRep ? .lastRep : .up)
        case "down": cue(.down)
        case "hold": cue(lastRep ? .lastRep : .holdStart)
        case "rest": cue(.rest)
        case "setup": cue(.getSet)
        default: break
        }
    }

    // Wrist cues. Apple only allows its built-in taps on the watch, so strength comes from
    // picking the firmer ones and stacking them with gaps the wrist can tell apart.
    enum Cue { case up, down, holdStart, holdTick, countdown, rest, getSet, newExercise, lastRep, done, control }

    private func pattern(_ c: Cue) -> [(WKHapticType, Double)] {
        switch c {
        case .up: return [(.directionUp, 0), (.directionUp, 0.32)]
        case .down: return [(.directionDown, 0), (.directionDown, 0.5)]
        case .holdStart: return [(.start, 0), (.start, 0.2)]
        case .holdTick: return [(.start, 0)]
        case .countdown: return [(.start, 0)]
        case .rest: return [(.stop, 0), (.stop, 0.35)]
        case .getSet: return [(.retry, 0)]
        case .newExercise: return [(.notification, 0)]
        case .lastRep: return [(.notification, 0)]
        case .done: return [(.success, 0)]
        case .control: return [(.start, 0)]
        }
    }

    func cue(_ c: Cue) {
        var p = pattern(c)
        if strength == 0 { p = Array(p.prefix(1)) }
        if strength == 2, let last = p.last { p.append((c == .countdown || c == .holdTick || c == .control ? .start : .notification, last.1 + 0.25)) }
        for (t, d) in p {
            if d == 0 { WKInterfaceDevice.current().play(t) }
            else { DispatchQueue.main.asyncAfter(deadline: .now() + d) { WKInterfaceDevice.current().play(t) } }
        }
    }

    func cycleStrength() { strength = (strength + 1) % 3; cue(.holdStart) }

    func toggleTextures() {
        textures.toggle()
        guard textures else { cue(.control); return }
        // a quick taste: five quickening ticks
        var t = 0.0
        for g in [0.5, 0.4, 0.3, 0.22, 0.2] { t += g; DispatchQueue.main.asyncAfter(deadline: .now() + t) { WKInterfaceDevice.current().play(.start) } }
    }

    private func finish(complete: Bool) {
        guard active else { return }
        active = false
        paused = false
        finished = complete ? "Round done" : "Session ended"
        if complete { cue(.done) }
        stopRuntime()
    }

    // MARK: controls (sent to the phone too)

    func pause() {
        guard active, !paused else { return }
        basePos = position; baseAt = Date(); paused = true
        cue(.control)
        sendCmd("pause")
    }

    func resume() {
        guard active, paused else { return }
        baseAt = Date(); paused = false; lastSecond = -1
        cue(.control)
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
