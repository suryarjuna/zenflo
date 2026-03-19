import ExpoModulesCore
import WidgetKit

public class WidgetSyncModule: Module {
    public func definition() -> ModuleDefinition {
        Name("WidgetSync")

        AsyncFunction("setWidgetData") { (jsonString: String) in
            guard let defaults = UserDefaults(suiteName: "group.com.zenflo.app") else {
                throw NSError(domain: "WidgetSync", code: 1, userInfo: [
                    NSLocalizedDescriptionKey: "Failed to access App Group UserDefaults"
                ])
            }
            defaults.set(jsonString, forKey: "widgetData")
            defaults.synchronize()

            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
            }
        }

        AsyncFunction("clearWidgetData") {
            guard let defaults = UserDefaults(suiteName: "group.com.zenflo.app") else { return }
            defaults.removeObject(forKey: "widgetData")
            defaults.synchronize()

            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
            }
        }
    }
}
