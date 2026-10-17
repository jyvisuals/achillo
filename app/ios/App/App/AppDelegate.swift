import UIKit
import Capacitor
import AVFoundation
import MediaPlayer

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
    ]

    private var player: AVAudioPlayer?
    private let synth = AVSpeechSynthesizer()
    private var remoteReady = false

    override public func load() {
        synth.usesApplicationAudioSession = true
        NotificationCenter.default.addObserver(self, selector: #selector(routeChanged(_:)), name: AVAudioSession.routeChangeNotification, object: nil)
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
            self.updateNowPlayingRate()
            call.resolve(["playing": ok, "position": p.currentTime])
        }
    }

    @objc func pause(_ call: CAPPluginCall) {
        main { self.player?.pause(); self.updateNowPlayingRate(); call.resolve(["position": self.player?.currentTime ?? 0]) }
    }

    @objc func seek(_ call: CAPPluginCall) {
        let t = call.getDouble("time") ?? 0
        main { if let p = self.player { p.currentTime = max(0, min(t, p.duration)) }; self.updateNowPlayingRate(); call.resolve() }
    }

    @objc func stop(_ call: CAPPluginCall) {
        main {
            self.player?.stop(); self.player = nil
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
        c.pauseCommand.addTarget { [weak self] _ in self?.notifyListeners("remote", data: ["cmd": "pause"]); return .success }
        c.togglePlayPauseCommand.addTarget { [weak self] _ in self?.notifyListeners("remote", data: ["cmd": "toggle"]); return .success }
        c.nextTrackCommand.addTarget { [weak self] _ in self?.notifyListeners("remote", data: ["cmd": "next"]); return .success }
        c.previousTrackCommand.addTarget { [weak self] _ in self?.notifyListeners("remote", data: ["cmd": "prev"]); return .success }
        c.skipForwardCommand.isEnabled = false
        c.skipBackwardCommand.isEnabled = false
        c.changePlaybackPositionCommand.isEnabled = false
    }

    public func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
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
