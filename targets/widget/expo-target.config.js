/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "widget",
  name: "ZenfloWidget",
  displayName: "zenflo",
  deploymentTarget: "17.0",
  frameworks: ["SwiftUI", "WidgetKit"],
  colors: {
    $accent: { color: "#E8853D", darkColor: "#E8853D" },
    $widgetBackground: { color: "#0F0E17", darkColor: "#0F0E17" },
  },
  entitlements: {
    "com.apple.security.application-groups": [
      `group.${config.ios.bundleIdentifier}`,
    ],
  },
});
