import ActivityKit
import WidgetKit
import SwiftUI

struct Akhil360Attributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var timeRemaining: Int
        var progress: Double
    }
    var name: String
    var venue: String
}

@main
struct LiveActivityWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: Akhil360Attributes.self) { context in
            HStack {
                VStack(alignment: .leading) {
                    Text(context.attributes.name).font(.headline).foregroundColor(.white)
                    Text("\(context.state.timeRemaining) Min Remaining").font(.title).bold().foregroundColor(.green)
                    Text(context.attributes.venue).font(.caption).foregroundColor(.gray)
                }
                Spacer()
                Image(systemName: "camera.circle.fill").foregroundColor(.green).font(.system(size: 40))
            }
            .padding().background(Color.black).activityBackgroundTint(Color.black)
            
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) { Text(context.attributes.name).font(.caption).foregroundColor(.green) }
                DynamicIslandExpandedRegion(.trailing) { Text("\(context.state.timeRemaining)m").bold().foregroundColor(.white) }
                DynamicIslandExpandedRegion(.bottom) { ProgressView(value: context.state.progress, total: 100).tint(.green) }
            } compactLeading: { Image(systemName: "camera").foregroundColor(.green)
            } compactTrailing: { Text("\(context.state.timeRemaining)m").foregroundColor(.green)
            } minimal: { Image(systemName: "camera").foregroundColor(.green) }
        }
    }
}
