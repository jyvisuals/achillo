import SwiftUI
import WatchKit
import UserNotifications

// Phone reminders are mirrored to the wrist; registering the same categories here puts a Start button on them.
final class WatchDelegate: NSObject, WKApplicationDelegate, UNUserNotificationCenterDelegate {
    func applicationDidFinishLaunching() {
        let c = UNUserNotificationCenter.current()
        c.delegate = self
        let start = UNNotificationAction(identifier: "start", title: "Start", options: [.foreground])
        let snooze = UNNotificationAction(identifier: "snooze", title: "Snooze 20 min", options: [])
        let done = UNNotificationAction(identifier: "done", title: "Done already", options: [])
        c.setNotificationCategories([
            UNNotificationCategory(identifier: "SNACK", actions: [start, snooze], intentIdentifiers: []),
            UNNotificationCategory(identifier: "ROUND", actions: [start, done], intentIdentifiers: []),
            UNNotificationCategory(identifier: "IMAGERY", actions: [snooze], intentIdentifiers: []),
        ])
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler finish: @escaping () -> Void) {
        let content = response.notification.request.content
        let cat = content.categoryIdentifier
        let m = SessionModel.shared
        switch response.actionIdentifier {
        case "start":
            if cat == "SNACK" { m.start("snack") } else if cat == "ROUND" { m.start("home") }
        case "snooze":
            m.sendCmd("snooze", ["title": content.title, "body": content.body, "category": cat])
        case "done":
            m.sendCmd("markRound")
        default: break
        }
        finish()
    }

    // Show it on the wrist even if the watch app is already open.
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler finish: @escaping (UNNotificationPresentationOptions) -> Void) {
        finish([.banner, .sound])
    }
}

@main
struct AchilloWatchApp: App {
    @WKApplicationDelegateAdaptor(WatchDelegate.self) private var delegate
    @StateObject private var model = SessionModel.shared

    var body: some Scene {
        WindowGroup {
            ContentView().environmentObject(model)
        }
    }
}
