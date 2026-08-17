//
//  LiveActivityWidgetBundle.swift
//  LiveActivityWidget
//
//  Created by Pavan gonuguntla on 8/15/26.
//

import WidgetKit
import SwiftUI

@main
struct LiveActivityWidgetBundle: WidgetBundle {
    var body: some Widget {
        LiveActivityWidget()
        LiveActivityWidgetControl()
        LiveActivityWidgetLiveActivity()
    }
}
