import Foundation
import Capacitor
import ActivityKit

@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPPlugin {
    var currentActivity: Activity<Akhil360Attributes>?
    
    @objc func startActivity(_ call: CAPPluginCall) {
        let name = call.getString("name") ?? "Shoot"
        let timeRemaining = call.getInt("timeRemaining") ?? 0
        let venue = call.getString("venue") ?? "Studio"
        let progress = call.getDouble("progress") ?? 0.0
        
        let attributes = Akhil360Attributes(name: name, venue: venue)
        let contentState = Akhil360Attributes.ContentState(timeRemaining: timeRemaining, progress: progress)
        
        do {
            currentActivity = try Activity.request(
                attributes: attributes,
                content: .init(state: contentState, staleDate: nil),
                pushType: nil
            )
            call.resolve(["id": currentActivity?.id ?? ""])
        } catch {
            call.reject("Error: \(error.localizedDescription)")
        }
    }
    
    @objc func updateActivity(_ call: CAPPluginCall) {
        guard let activity = currentActivity else { call.reject("No active activity"); return }
        let timeRemaining = call.getInt("timeRemaining") ?? 0
        let progress = call.getDouble("progress") ?? 0.0
        let contentState = Akhil360Attributes.ContentState(timeRemaining: timeRemaining, progress: progress)
        
        Task {
            await activity.update(.init(state: contentState, staleDate: nil))
            call.resolve()
        }
    }
    
    @objc func endActivity(_ call: CAPPluginCall) {
        guard let activity = currentActivity else { call.resolve(); return }
        Task {
            await activity.end(nil, dismissalPolicy: .immediate)
            currentActivity = nil
            call.resolve()
        }
    }
}

