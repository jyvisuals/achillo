import UIKit
import Capacitor
import AVFoundation
import MediaPlayer
import CoreHaptics
import WatchConnectivity

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Keep the exercise cues playing with the screen locked or another app in front.
        // Pairs with UIBackgroundModes=audio in Info.plist.
        activateAudioSession()
        // Phone call / Siri / alarm: tell the page so the session pauses itself, then resumes.
        NotificationCenter.default.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { note in
            guard let info = note.userInfo,
                  let raw = info[AVAudioSessionInterruptionTypeKey] as? UInt,
                  let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }
            // iOS also reports an "interruption" when it merely suspended the app in the background
            // (nothing was playing, e.g. sound cues off). That isn't a phone call: don't pause for it.
            if type == .began {
                if let r = info[AVAudioSessionInterruptionReasonKey] as? UInt, r == AVAudioSession.InterruptionReason.appWasSuspended.rawValue { return }
                if (info[AVAudioSessionInterruptionWasSuspendedKey] as? NSNumber)?.boolValue == true { return }
            }
            switch type {
            case .began:
                self.tellPage("window.dispatchEvent(new CustomEvent('ach:interrupt',{detail:{began:true}}))")
            case .ended:
                self.activateAudioSession()
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                    self.tellPage("window.dispatchEvent(new CustomEvent('ach:interrupt',{detail:{began:false}}))")
                }
            @unknown default: break
            }
        }
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func tellPage(_ js: String) {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        let root = scenes.flatMap { $0.windows }.first { $0.isKeyWindow }?.rootViewController
        guard let vc = root as? CAPBridgeViewController else { return }
        vc.bridge?.webView?.evaluateJavaScript(js, completionHandler: nil)
    }

    func activateAudioSession() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            print("audio session: \(error)")
        }
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}

// MARK: - Bridge view controller that registers the app's own native plugin.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(AchAudioPlugin())
    }
}

// MARK: - AchAudio: native playback of the session's cue track, native speech,
// headphone handling and lock-screen controls. Replaces the web view's <audio> and
// speechSynthesis, which iOS pauses or mutes unpredictably.
@objc(AchAudioPlugin)
public class AchAudioPlugin: CAPPlugin, CAPBridgedPlugin, AVAudioPlayerDelegate {
    public let identifier = "AchAudioPlugin"
    public let jsName = "AchAudio"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "play", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pause", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "seek", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "speak", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopSpeaking", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "voices", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "nowPlaying", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "render", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "haptic", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "watch", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "preparePlan", returnType: CAPPluginReturnPromise),
    ]

    private var player: AVAudioPlayer?
    private var wantPlaying = false   // the session wants the cue track running
    private var bgAt = Date.distantPast
    private let synth = AVSpeechSynthesizer()
    private var remoteReady = false
    private let watchLink = WatchLink()

    override public func load() {
        watchLink.onMessage = { [weak self] msg in self?.handleWatch(msg) }
        watchLink.start()
        synth.usesApplicationAudioSession = true
        NotificationCenter.default.addObserver(self, selector: #selector(routeChanged(_:)), name: AVAudioSession.routeChangeNotification, object: nil)
        // Leaving the app: make sure the cue track keeps running (iOS sometimes stops it on the way out).
        NotificationCenter.default.addObserver(self, selector: #selector(wentBackground), name: UIApplication.didEnterBackgroundNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(cameBack), name: UIApplication.willEnterForegroundNotification, object: nil)
    }
    @objc func wentBackground() {
        bgAt = Date()
        for delay in [0.3, 1.2, 3.0] {
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
                guard let self = self, self.wantPlaying, let p = self.player, !p.isPlaying, p.currentTime < p.duration - 0.5 else { return }
                self.activate(); let ok = p.play(); self.updateNowPlayingRate()
                self.notifyListeners("log", data: ["msg": "background: cue track had stopped, restarted (\(ok ? "ok" : "failed"))"])
            }
        }
    }
    @objc func cameBack() {
        guard wantPlaying, let p = player, !p.isPlaying, p.currentTime < p.duration - 0.5 else { return }
        notifyListeners("log", data: ["msg": "foreground: cue track was stopped at \(Int(p.currentTime))s while away"])
    }

    private func activate() {
        let s = AVAudioSession.sharedInstance()
        try? s.setCategory(.playback, mode: .default, options: [.mixWithOthers])
        try? s.setActive(true)
    }

    private func main(_ f: @escaping () -> Void) { DispatchQueue.main.async(execute: f) }

    @objc func open(_ call: CAPPluginCall) {
        guard let path = call.getString("path") else { call.reject("path required"); return }
        let url = path.hasPrefix("file://") ? URL(string: path) : URL(fileURLWithPath: path)
        main {
            do {
                self.activate()
                self.player?.stop()
                let p = try AVAudioPlayer(contentsOf: url!)
                p.delegate = self
                p.prepareToPlay()
                self.player = p
                self.setupRemote()
                call.resolve(["duration": p.duration])
            } catch { call.reject("open failed: \(error.localizedDescription)") }
        }
    }

    @objc func play(_ call: CAPPluginCall) {
        let at = call.getDouble("time")
        main {
            guard let p = self.player else { call.reject("nothing loaded"); return }
            self.activate()
            if let at = at { p.currentTime = max(0, min(at, p.duration)) }
            let ok = p.play()
            self.wantPlaying = ok
            self.updateNowPlayingRate()
            call.resolve(["playing": ok, "position": p.currentTime])
        }
    }

    @objc func pause(_ call: CAPPluginCall) {
        main { self.wantPlaying = false; self.player?.pause(); self.updateNowPlayingRate(); call.resolve(["position": self.player?.currentTime ?? 0]) }
    }

    @objc func seek(_ call: CAPPluginCall) {
        let t = call.getDouble("time") ?? 0
        main { if let p = self.player { p.currentTime = max(0, min(t, p.duration)) }; self.updateNowPlayingRate(); call.resolve() }
    }

    @objc func stop(_ call: CAPPluginCall) {
        main {
            self.wantPlaying = false; self.player?.stop(); self.player = nil
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
            call.resolve()
        }
    }

    @objc func status(_ call: CAPPluginCall) {
        main {
            let p = self.player
            call.resolve(["playing": p?.isPlaying ?? false, "position": p?.currentTime ?? 0, "duration": p?.duration ?? 0, "speaking": self.synth.isSpeaking])
        }
    }

    @objc func speak(_ call: CAPPluginCall) {
        let text = call.getString("text") ?? ""
        let rate = Float(call.getDouble("rate") ?? 1.0)
        let voiceId = call.getString("voice") ?? ""
        main {
            self.activate()
            if self.synth.isSpeaking { self.synth.stopSpeaking(at: .immediate) }
            let u = AVSpeechUtterance(string: text)
            if !voiceId.isEmpty, let v = AVSpeechSynthesisVoice(identifier: voiceId) { u.voice = v }
            else { u.voice = AVSpeechSynthesisVoice(language: AVSpeechSynthesisVoice.currentLanguageCode()) }
            // web rate 1.0 ≈ iOS default 0.5
            u.rate = max(AVSpeechUtteranceMinimumSpeechRate, min(AVSpeechUtteranceMaximumSpeechRate, AVSpeechUtteranceDefaultSpeechRate * rate))
            self.synth.speak(u)
            call.resolve()
        }
    }

    @objc func stopSpeaking(_ call: CAPPluginCall) {
        main { self.synth.stopSpeaking(at: .immediate); call.resolve() }
    }

    @objc func voices(_ call: CAPPluginCall) {
        let list = AVSpeechSynthesisVoice.speechVoices().filter { $0.language.hasPrefix("en") }.map { v -> [String: Any] in
            let q: String
            switch v.quality { case .premium: q = "premium"; case .enhanced: q = "enhanced"; default: q = "default" }
            return ["id": v.identifier, "name": v.name, "lang": v.language, "quality": q]
        }
        call.resolve(["voices": list])
    }

    // MARK: haptic: Core Haptics patterns shaped like the movement (ramps for up/down, a thud for hold, ticks to count down).
    private var hEngine: CHHapticEngine?
    private func engine() -> CHHapticEngine? {
        if let e = hEngine { return e }
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics, let e = try? CHHapticEngine() else { return nil }
        e.playsHapticsOnly = true
        e.isAutoShutdownEnabled = false // sessions fire patterns every second or two; keep it running
        e.resetHandler = { [weak self] in try? self?.hEngine?.start() }
        e.stoppedHandler = { [weak self] _ in self?.hEngine = nil }
        try? e.start()
        hEngine = e
        return e
    }
    private func tap(_ t: Double, _ i: Float, _ s: Float) -> CHHapticEvent {
        CHHapticEvent(eventType: .hapticTransient, parameters: [CHHapticEventParameter(parameterID: .hapticIntensity, value: i), CHHapticEventParameter(parameterID: .hapticSharpness, value: s)], relativeTime: t)
    }
    private func hum(_ t: Double, _ d: Double, _ i: Float, _ s: Float) -> CHHapticEvent {
        CHHapticEvent(eventType: .hapticContinuous, parameters: [CHHapticEventParameter(parameterID: .hapticIntensity, value: i), CHHapticEventParameter(parameterID: .hapticSharpness, value: s)], relativeTime: t, duration: d)
    }
    @objc func watch(_ call: CAPPluginCall) {
        let json = call.getString("json") ?? ""
        main {
            if let o = Self.parse(json) {
                if (o["type"] as? String) == "plan" { self.loadPlan(o) } else if (o["type"] as? String) == "end" { self.planActive = false }
            }
            self.watchLink.send(json)
            call.resolve(["paired": self.watchLink.paired, "installed": self.watchLink.installed, "reachable": self.watchLink.reachable])
        }
    }

    // The next likely session, already rendered, so the watch can start it with the phone locked.
    @objc func preparePlan(_ call: CAPPluginCall) {
        let json = call.getString("json") ?? "", path = call.getString("path") ?? ""
        main {
            if let o = Self.parse(json), !path.isEmpty { self.preparedPlan = o; self.preparedPath = path; self.preparedMode = (o["mode"] as? String) ?? "home" }
            call.resolve()
        }
    }

    // MARK: session clock — the page is the truth while it's awake; this keeps time (and obeys the watch) while it sleeps.
    private var plan: [String: Any]? = nil
    private var planSteps: [(kind: String, secs: Double, ex: Int)] = []
    private var planRest: [Bool] = []
    private var planOffsets: [Double] = []
    private var planPos: Double = 0
    private var planAt = Date()
    private var planPaused = false
    private var planActive = false
    private var preparedPlan: [String: Any]? = nil
    private var preparedPath: String? = nil
    private var preparedMode = "home"

    private static func parse(_ json: String) -> [String: Any]? {
        guard let d = json.data(using: .utf8) else { return nil }
        return (try? JSONSerialization.jsonObject(with: d)) as? [String: Any]
    }
    private static func num(_ x: Any?) -> Double { (x as? NSNumber)?.doubleValue ?? 0 }

    private func loadPlan(_ o: [String: Any]) {
        plan = o
        let st = (o["steps"] as? [[Any]]) ?? []
        planSteps = st.map { a in (kind: a.count > 0 ? (a[0] as? String ?? "") : "", secs: a.count > 1 ? Self.num(a[1]) : 0, ex: a.count > 2 ? Int(Self.num(a[2])) : 0) }
        planRest = ((o["ex"] as? [[Any]]) ?? []).map { a in a.count > 4 && Self.num(a[4]) > 0 }
        var t = 0.0
        planOffsets = planSteps.map { s in let r = t; t += max(0, s.secs); return r }
        planPos = Self.num(o["pos"])
        planAt = Date(timeIntervalSince1970: Self.num(o["at"]) / 1000)
        planPaused = (o["paused"] as? Bool) ?? false
        planActive = !planSteps.isEmpty
    }

    private func clockPos() -> Double { planPaused ? planPos : planPos + Date().timeIntervalSince(planAt) }
    private var planTotal: Double { (planOffsets.last ?? 0) + max(0, planSteps.last?.secs ?? 0) }

    // Same rule as the page: skip this set and the rest after it; during a rest or setup, just the wait.
    private func skipTarget(from p: Double) -> Double {
        guard !planSteps.isEmpty else { return p }
        var i = 0
        for k in 0..<planSteps.count { if planOffsets[k] <= p { i = k } else { break } }
        while i < planSteps.count - 1 && planSteps[i].secs <= 0 { i += 1 }
        let s = planSteps[i]
        let isRest: (Int) -> Bool = { e in e < self.planRest.count ? self.planRest[e] : false }
        var j = i + 1
        if !(s.kind == "setup" || s.kind == "rest" || isRest(s.ex)) {
            while j < planSteps.count && (planSteps[j].ex == s.ex || isRest(planSteps[j].ex) || planSteps[j].secs <= 0) { j += 1 }
        }
        return j < planSteps.count ? planOffsets[j] : planTotal
    }

    private func startPrepared() -> Bool {
        guard let o = preparedPlan, let path = preparedPath else { return false }
        guard let url = path.hasPrefix("file://") ? URL(string: path) : URL(fileURLWithPath: path),
              let p = try? AVAudioPlayer(contentsOf: url) else { return false }
        activate()
        player?.stop()
        p.delegate = self
        p.prepareToPlay()
        player = p
        setupRemote()
        var fresh = o
        fresh["pos"] = 0
        fresh["at"] = Date().timeIntervalSince1970 * 1000
        fresh["paused"] = false
        loadPlan(fresh)
        p.currentTime = 0
        wantPlaying = p.play()
        preparedPlan = nil
        return true
    }

    private func handleWatch(_ msg: [String: Any]) {
        let cmd = msg["cmd"] as? String ?? ""
        switch cmd {
        case "pause":
            if planActive && !planPaused { planPos = clockPos(); planAt = Date(); planPaused = true }
            player?.pause(); wantPlaying = false
        case "play":
            if planActive && planPaused {
                planAt = Date(); planPaused = false
                if let p = player { activate(); p.currentTime = max(0, min(planPos, p.duration)); wantPlaying = p.play() }
            }
        case "skip":
            if planActive {
                let to = skipTarget(from: clockPos())
                planPos = to; planAt = Date()
                if let p = player { p.currentTime = max(0, min(to, p.duration)) }
            }
        case "end":
            planActive = false
            player?.pause(); wantPlaying = false
        case "start":
            if !planActive && preparedMode == ((msg["mode"] as? String) ?? "home") { _ = startPrepared() }
        default: break
        }
        updateNowPlayingRate()
        var out = msg
        out["from"] = "watch"
        if planActive, var o = plan {
            planPos = clockPos(); planAt = Date()
            out["pos"] = planPos; out["at"] = planAt.timeIntervalSince1970 * 1000; out["paused"] = planPaused
            o["pos"] = planPos; o["at"] = planAt.timeIntervalSince1970 * 1000; o["paused"] = planPaused; o["type"] = "plan"
            if let d = try? JSONSerialization.data(withJSONObject: o), let j = String(data: d, encoding: .utf8) { watchLink.send(j) }
        } else if cmd == "end" {
            watchLink.send("{\"type\":\"end\",\"complete\":false}")
        }
        notifyListeners("watch", data: out, retainUntilConsumed: true)
    }

    @objc func haptic(_ call: CAPPluginCall) {
        let name = call.getString("pattern") ?? "tap"
        let raw = call.getDouble("secs") ?? 1
        let secs = max(0.2, min(raw, 6))
        let k = Float(max(0.3, min(call.getDouble("strength") ?? 1, 1)))
        main {
            guard let e = self.engine() else { call.resolve(["ok": false]); return }
            var ev: [CHHapticEvent] = []
            var curves: [CHHapticParameterCurve] = []
            switch name {
            case "up": // pressure building: a smooth hum that swells and turns gritty, with grains that come faster near the top
                let d = secs * 0.92
                ev = [self.tap(0, 0.55 * k, 0.5), self.hum(0, d, 1, 0.5)]
                var t = 0.18, gapT = 0.22
                while t < d - 0.05 { let f = Float(t / d); ev.append(self.tap(t, (0.12 + 0.35 * f) * k, 0.55 + 0.45 * f)); gapT = max(0.07, gapT * 0.86); t += gapT }
                curves = [CHHapticParameterCurve(parameterID: .hapticIntensityControl, controlPoints: [.init(relativeTime: 0, value: 0.35 * k), .init(relativeTime: d * 0.6, value: 0.7 * k), .init(relativeTime: d, value: 1.0 * k)], relativeTime: 0),
                          CHHapticParameterCurve(parameterID: .hapticSharpnessControl, controlPoints: [.init(relativeTime: 0, value: -0.4), .init(relativeTime: d, value: 0.35)], relativeTime: 0)]
            case "down": // easing off: the mirror of the push — a clear start beat, then soft beats that slow down and fade, like a ball settling
                let d = secs * 0.92
                ev = [self.tap(0, 0.9 * k, 0.35)]
                var t = 0.16, gapT = 0.14
                while t < d - 0.04 { let f = Float(t / d); ev.append(self.tap(t, (0.75 - 0.55 * f) * k, 0.25 - 0.15 * f)); gapT = min(0.5, gapT * 1.3); t += gapT }
            case "hold": // a firm thud, then a soft heartbeat every second ("keep holding"), then three sharp ticks before release
                let h = max(0.5, min(raw, 90))
                ev = [self.tap(0, 1 * k, 0.7), self.hum(0.02, 0.25, 0.5 * k, 0.3)]
                let n = Int(h.rounded())
                if n >= 2 { for t in 1..<n { let left = n - t; ev.append(left <= 3 && n >= 6 ? self.tap(Double(t), 0.55 * k, 0.95) : self.tap(Double(t), 0.32 * k, 0.15)) } }
            case "stop":
                try? self.hPlayer?.stop(atTime: CHHapticTimeImmediate); self.hPlayer = nil
                self.hEngine?.stop(completionHandler: nil); self.hEngine = nil // rebuilt on the next pattern
                call.resolve(["ok": true]); return
            case "tick": ev = [self.tap(0, 0.45 * k, 0.9)]
            case "go": ev = [self.tap(0, 1 * k, 1), self.tap(0.11, 0.8 * k, 0.8)]
            case "rest": ev = [self.tap(0, 0.75 * k, 1), self.tap(0.13, 0.75 * k, 1)] // a crisp double-click, then stillness: nothing like the smooth lowering
            case "setup": ev = [self.tap(0, 0.7 * k, 0.4)]
            case "relax": ev = [self.tap(0, 0.3 * k, 0.1)]
            case "lastrep": ev = [self.tap(0, 0.6 * k, 0.9), self.tap(0.09, 0.6 * k, 0.9), self.tap(0.18, 0.6 * k, 0.9)]
            case "success": ev = [self.tap(0, 0.5 * k, 0.5), self.tap(0.12, 0.75 * k, 0.6), self.tap(0.26, 1 * k, 0.8)]
            case "warn": ev = [self.hum(0, 0.35, 1 * k, 0.6), self.hum(0.55, 0.35, 1 * k, 0.6), self.hum(1.1, 0.35, 1 * k, 0.6)]
            default: ev = [self.tap(0, 0.6 * k, 0.5)]
            }
            let overlay = ["tick", "warn", "success"].contains(name) // these layer on top; step patterns replace each other
            let pat: CHHapticPattern
            do { pat = try CHHapticPattern(events: ev, parameterCurves: curves) } catch { call.resolve(["ok": false, "error": "pattern \(name): \(error.localizedDescription)"]); return }
            func play(_ eng: CHHapticEngine) throws {
                try eng.start()
                if !overlay { try? self.hPlayer?.stop(atTime: CHHapticTimeImmediate) } // an old player from a stopped engine can throw; ignore
                let pl = try eng.makePlayer(with: pat)
                if !overlay { self.hPlayer = pl }
                try pl.start(atTime: CHHapticTimeImmediate)
            }
            do { try play(e); call.resolve(["ok": true]) }
            catch {
                // the engine idles out between phases; rebuild it once and try again
                self.hEngine?.stop(completionHandler: nil); self.hEngine = nil; self.hPlayer = nil
                if let e2 = self.engine(), (try? play(e2)) != nil { call.resolve(["ok": true, "retried": true]) }
                else { call.resolve(["ok": false, "error": error.localizedDescription]) }
            }
        }
    }
    private var hPlayer: CHHapticPatternPlayer?

    @objc func nowPlaying(_ call: CAPPluginCall) {
        let title = call.getString("title") ?? "Achilló"
        let artist = call.getString("artist") ?? ""
        main {
            var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
            info[MPMediaItemPropertyTitle] = title
            info[MPMediaItemPropertyArtist] = artist
            info[MPMediaItemPropertyAlbumTitle] = "Achilló"
            if let p = self.player {
                info[MPMediaItemPropertyPlaybackDuration] = p.duration
                info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = p.currentTime
                info[MPNowPlayingInfoPropertyPlaybackRate] = p.isPlaying ? 1.0 : 0.0
            }
            MPNowPlayingInfoCenter.default().nowPlayingInfo = info
            call.resolve()
        }
    }

    // MARK: render: mix spoken instructions into the cue track, so the whole session is one file.
    // items: [{t: seconds, text}] placed on the session timeline; output 16 kHz mono WAV in Caches.
    private let renderQueue = DispatchQueue(label: "achillo.render", qos: .userInitiated)
    private let renderSynth = AVSpeechSynthesizer()

    @objc func render(_ call: CAPPluginCall) {
        guard let cuePath = call.getString("cuePath"), let cueURL = URL(string: cuePath) ?? Optional(URL(fileURLWithPath: cuePath)) else { call.reject("cuePath required"); return }
        let outName = call.getString("out") ?? "baked.wav"
        let rate = Float(call.getDouble("rate") ?? 1.0)
        let voiceId = call.getString("voice") ?? ""
        let items: [JSObject] = call.getArray("items", JSObject.self) ?? []
        renderQueue.async {
            do {
                let sr: Double = 16000
                guard let fmt = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: sr, channels: 1, interleaved: false) else { throw NSError(domain: "render", code: 1) }
                // cue track → 16 kHz float
                let cueFile = try AVAudioFile(forReading: cueURL)
                guard let cueBuf = AVAudioPCMBuffer(pcmFormat: cueFile.processingFormat, frameCapacity: AVAudioFrameCount(cueFile.length)) else { throw NSError(domain: "render", code: 2) }
                try cueFile.read(into: cueBuf)
                guard let cue16 = self.convert(cueBuf, to: fmt) else { throw NSError(domain: "render", code: 3, userInfo: [NSLocalizedDescriptionKey: "cue convert"]) }
                let n = Int(cue16.frameLength)
                var out = [Float](repeating: 0, count: n)
                if let ch = cue16.floatChannelData?[0] { for i in 0..<n { out[i] = ch[i] } }
                // each instruction → speech buffers → mixed in at its time
                let voice: AVSpeechSynthesisVoice? = voiceId.isEmpty ? AVSpeechSynthesisVoice(language: AVSpeechSynthesisVoice.currentLanguageCode()) : (AVSpeechSynthesisVoice(identifier: voiceId) ?? AVSpeechSynthesisVoice(language: AVSpeechSynthesisVoice.currentLanguageCode()))
                var placed = 0
                for it in items {
                    guard let text = it["text"] as? String, !text.isEmpty else { continue }
                    let t = (it["t"] as? NSNumber)?.doubleValue ?? 0
                    let u = AVSpeechUtterance(string: text)
                    u.voice = voice
                    u.rate = max(AVSpeechUtteranceMinimumSpeechRate, min(AVSpeechUtteranceMaximumSpeechRate, AVSpeechUtteranceDefaultSpeechRate * rate))
                    let done = DispatchSemaphore(value: 0)
                    var pieces: [AVAudioPCMBuffer] = []
                    var finished = false
                    let lock = NSLock()
                    DispatchQueue.main.async {
                        self.renderSynth.write(u) { b in
                            guard let pb = b as? AVAudioPCMBuffer else { return }
                            lock.lock(); defer { lock.unlock() }
                            if pb.frameLength == 0 { if !finished { finished = true; done.signal() }; return }
                            if let c = self.convert(pb, to: fmt) { pieces.append(c) }
                        }
                    }
                    _ = done.wait(timeout: .now() + 15)
                    lock.lock(); let got = pieces; lock.unlock()
                    // stop each line where the next one starts (or where a skip could land), with a short fade
                    let until = (it["until"] as? NSNumber)?.doubleValue ?? 0
                    let stop = until > t ? min(n, Int(until * sr)) : n
                    let fade = Int(0.08 * sr)
                    var at = Int(t * sr)
                    for pc in got {
                        guard let ch = pc.floatChannelData?[0] else { continue }
                        let m = Int(pc.frameLength)
                        for i in 0..<m where at + i < stop && at + i >= 0 {
                            let left = stop - (at + i)
                            let g: Float = left < fade ? Float(left) / Float(fade) : 1
                            out[at + i] = max(-1, min(1, out[at + i] * 0.6 + ch[i] * g))
                        }
                        at += m
                    }
                    placed += 1
                }
                // write 16-bit WAV
                let dir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
                let outURL = dir.appendingPathComponent(outName)
                try? FileManager.default.removeItem(at: outURL)
                let settings: [String: Any] = [AVFormatIDKey: kAudioFormatLinearPCM, AVSampleRateKey: sr, AVNumberOfChannelsKey: 1, AVLinearPCMBitDepthKey: 16, AVLinearPCMIsFloatKey: false, AVLinearPCMIsBigEndianKey: false]
                let file = try AVAudioFile(forWriting: outURL, settings: settings, commonFormat: .pcmFormatFloat32, interleaved: false)
                let chunk = 16000 * 30
                var i = 0
                while i < n {
                    let m = min(chunk, n - i)
                    guard let b = AVAudioPCMBuffer(pcmFormat: fmt, frameCapacity: AVAudioFrameCount(m)) else { break }
                    b.frameLength = AVAudioFrameCount(m)
                    out.withUnsafeBufferPointer { src in b.floatChannelData![0].update(from: src.baseAddress! + i, count: m) }
                    try file.write(from: b)
                    i += m
                }
                call.resolve(["path": outURL.absoluteString, "placed": placed, "duration": Double(n) / sr])
            } catch {
                call.reject("render failed: \(error.localizedDescription)")
            }
        }
    }

    private func convert(_ buf: AVAudioPCMBuffer, to fmt: AVAudioFormat) -> AVAudioPCMBuffer? {
        if buf.format == fmt { return buf }
        guard let conv = AVAudioConverter(from: buf.format, to: fmt) else { return nil }
        let ratio = fmt.sampleRate / buf.format.sampleRate
        let cap = AVAudioFrameCount(Double(buf.frameLength) * ratio + 1024)
        guard let out = AVAudioPCMBuffer(pcmFormat: fmt, frameCapacity: cap) else { return nil }
        var fed = false
        var err: NSError?
        conv.convert(to: out, error: &err) { _, status in
            if fed { status.pointee = .endOfStream; return nil }
            fed = true; status.pointee = .haveData; return buf
        }
        return err == nil ? out : nil
    }

    private func updateNowPlayingRate() {
        guard let p = player else { return }
        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
        info[MPMediaItemPropertyPlaybackDuration] = p.duration
        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = p.currentTime
        info[MPNowPlayingInfoPropertyPlaybackRate] = p.isPlaying ? 1.0 : 0.0
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    private func setupRemote() {
        if remoteReady { return }
        remoteReady = true
        let c = MPRemoteCommandCenter.shared()
        c.playCommand.addTarget { [weak self] _ in self?.notifyListeners("remote", data: ["cmd": "play"]); return .success }
        c.pauseCommand.addTarget { [weak self] _ in guard let self = self else { return .success }; if Date().timeIntervalSince(self.bgAt) < 2 { self.notifyListeners("log", data: ["msg": "ignored a pause sent while leaving the app"]); return .success }; self.notifyListeners("remote", data: ["cmd": "pause"]); return .success }
        c.togglePlayPauseCommand.addTarget { [weak self] _ in guard let self = self else { return .success }; if Date().timeIntervalSince(self.bgAt) < 2 { self.notifyListeners("log", data: ["msg": "ignored a play/pause toggle sent while leaving the app"]); return .success }; self.notifyListeners("remote", data: ["cmd": "toggle"]); return .success }
        c.nextTrackCommand.addTarget { [weak self] _ in self?.notifyListeners("remote", data: ["cmd": "next"]); return .success }
        c.previousTrackCommand.addTarget { [weak self] _ in self?.notifyListeners("remote", data: ["cmd": "prev"]); return .success }
        c.skipForwardCommand.isEnabled = false
        c.skipBackwardCommand.isEnabled = false
        c.changePlaybackPositionCommand.isEnabled = false
    }

    public func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) { wantPlaying = false;
        notifyListeners("ended", data: [:])
    }

    @objc private func routeChanged(_ note: Notification) {
        guard let raw = note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: raw) else { return }
        if reason == .oldDeviceUnavailable {
            main {
                self.player?.pause()
                self.synth.stopSpeaking(at: .immediate)
                self.updateNowPlayingRate()
                self.notifyListeners("routeLost", data: [:])
            }
        }
    }
}

// Talks to the Apple Watch app: the session plan goes out, pause/skip/end come back.
final class WatchLink: NSObject, WCSessionDelegate {
    var onMessage: (([String: Any]) -> Void)?
    func start() {
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }
    var paired: Bool { WCSession.isSupported() && WCSession.default.activationState == .activated && WCSession.default.isPaired }
    var installed: Bool { paired && WCSession.default.isWatchAppInstalled }
    var reachable: Bool { WCSession.isSupported() && WCSession.default.isReachable }
    func send(_ json: String) {
        guard installed, !json.isEmpty else { return }
        let msg: [String: Any] = ["json": json]
        if WCSession.default.isReachable {
            WCSession.default.sendMessage(msg, replyHandler: nil) { _ in try? WCSession.default.updateApplicationContext(msg) }
        } else {
            try? WCSession.default.updateApplicationContext(msg)
        }
    }
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}
    func sessionDidBecomeInactive(_ session: WCSession) {}
    func sessionDidDeactivate(_ session: WCSession) { WCSession.default.activate() }
    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        DispatchQueue.main.async { self.onMessage?(message) }
    }
    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        DispatchQueue.main.async { self.onMessage?(userInfo) }
    }
}
