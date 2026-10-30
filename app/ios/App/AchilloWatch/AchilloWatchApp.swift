import SwiftUI

@main
struct AchilloWatchApp: App {
    @StateObject private var model = SessionModel.shared

    var body: some Scene {
        WindowGroup {
            ContentView().environmentObject(model)
        }
    }
}
