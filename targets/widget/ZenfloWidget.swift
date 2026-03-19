import WidgetKit
import SwiftUI

// MARK: - Data Models

struct WidgetTask: Codable, Identifiable {
    let id: String
    let title: String
    let priority: String
    let dueDate: String?
}

struct WidgetHabit: Codable, Identifiable {
    let id: String
    let title: String
    let completed: Bool
    let currentStreak: Int
}

struct WidgetStats: Codable {
    let totalHabits: Int
    let completedHabits: Int
    let pendingTaskCount: Int
}

struct WidgetData: Codable {
    let pendingTasks: [WidgetTask]
    let todayHabits: [WidgetHabit]
    let stats: WidgetStats
    let lastUpdated: String
}

// MARK: - App Group

private let appGroupID = "group.com.zenflo.app"
private let dataKey = "widgetData"

func loadWidgetData() -> WidgetData? {
    guard let defaults = UserDefaults(suiteName: appGroupID),
          let jsonString = defaults.string(forKey: dataKey),
          let data = jsonString.data(using: .utf8) else {
        return nil
    }
    return try? JSONDecoder().decode(WidgetData.self, from: data)
}

// MARK: - Timeline Provider

struct ZenfloProvider: TimelineProvider {
    func placeholder(in context: Context) -> ZenfloEntry {
        ZenfloEntry(
            date: Date(),
            data: WidgetData(
                pendingTasks: [
                    WidgetTask(id: "1", title: "Review design specs", priority: "high", dueDate: nil),
                    WidgetTask(id: "2", title: "Write unit tests", priority: "medium", dueDate: nil),
                ],
                todayHabits: [
                    WidgetHabit(id: "1", title: "Meditate", completed: true, currentStreak: 7),
                    WidgetHabit(id: "2", title: "Read 30 min", completed: false, currentStreak: 3),
                ],
                stats: WidgetStats(totalHabits: 4, completedHabits: 2, pendingTaskCount: 3),
                lastUpdated: ""
            )
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (ZenfloEntry) -> Void) {
        let data = loadWidgetData()
        completion(ZenfloEntry(date: Date(), data: data))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ZenfloEntry>) -> Void) {
        let data = loadWidgetData()
        let entry = ZenfloEntry(date: Date(), data: data)
        // Refresh every 30 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// MARK: - Timeline Entry

struct ZenfloEntry: TimelineEntry {
    let date: Date
    let data: WidgetData?
}

// MARK: - Theme Colors

struct ZenfloColors {
    static let background = Color(red: 15/255, green: 14/255, blue: 23/255)
    static let surface = Color(red: 42/255, green: 34/255, blue: 52/255)
    static let accent = Color(red: 232/255, green: 133/255, blue: 61/255)
    static let textPrimary = Color(red: 244/255, green: 243/255, blue: 255/255)
    static let textSecondary = Color(red: 155/255, green: 153/255, blue: 197/255)
    static let success = Color(red: 34/255, green: 197/255, blue: 94/255)
    static let danger = Color(red: 239/255, green: 68/255, blue: 68/255)
    static let warning = Color(red: 234/255, green: 179/255, blue: 8/255)
}

// MARK: - Small Widget View

struct SmallWidgetView: View {
    let entry: ZenfloEntry

    var habitProgress: Double {
        guard let data = entry.data, data.stats.totalHabits > 0 else { return 0 }
        return Double(data.stats.completedHabits) / Double(data.stats.totalHabits)
    }

    var body: some View {
        if let data = entry.data {
            VStack(spacing: 8) {
                // Progress ring
                ZStack {
                    Circle()
                        .stroke(ZenfloColors.surface, lineWidth: 6)
                        .frame(width: 60, height: 60)
                    Circle()
                        .trim(from: 0, to: habitProgress)
                        .stroke(
                            ZenfloColors.accent,
                            style: StrokeStyle(lineWidth: 6, lineCap: .round)
                        )
                        .frame(width: 60, height: 60)
                        .rotationEffect(.degrees(-90))
                    VStack(spacing: 0) {
                        Text("\(data.stats.completedHabits)")
                            .font(.system(size: 18, weight: .bold, design: .rounded))
                            .foregroundColor(ZenfloColors.textPrimary)
                        Text("/\(data.stats.totalHabits)")
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundColor(ZenfloColors.textSecondary)
                    }
                }

                // Pending tasks count
                HStack(spacing: 4) {
                    Image(systemName: "checklist")
                        .font(.system(size: 11))
                        .foregroundColor(ZenfloColors.accent)
                    Text("\(data.stats.pendingTaskCount) tasks")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundColor(ZenfloColors.textSecondary)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .widgetURL(URL(string: "zenflo://home"))
        } else {
            emptyState
        }
    }

    var emptyState: some View {
        VStack(spacing: 6) {
            Image(systemName: "leaf.fill")
                .font(.system(size: 24))
                .foregroundColor(ZenfloColors.accent)
            Text("Open zenflo")
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundColor(ZenfloColors.textSecondary)
            Text("to sync data")
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .foregroundColor(ZenfloColors.textSecondary.opacity(0.7))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetURL(URL(string: "zenflo://home"))
    }
}

// MARK: - Medium Widget View

struct MediumWidgetView: View {
    let entry: ZenfloEntry

    var body: some View {
        if let data = entry.data {
            HStack(spacing: 12) {
                // Left: Habits
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 4) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 11))
                            .foregroundColor(ZenfloColors.accent)
                        Text("Habits")
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                            .foregroundColor(ZenfloColors.textPrimary)
                    }

                    if data.todayHabits.isEmpty {
                        Text("No habits today")
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundColor(ZenfloColors.textSecondary)
                    } else {
                        ForEach(data.todayHabits.prefix(4)) { habit in
                            Link(destination: URL(string: "zenflo://habit/\(habit.id)")!) {
                                HStack(spacing: 6) {
                                    Image(systemName: habit.completed ? "checkmark.circle.fill" : "circle")
                                        .font(.system(size: 13))
                                        .foregroundColor(habit.completed ? ZenfloColors.success : ZenfloColors.textSecondary)
                                    Text(habit.title)
                                        .font(.system(size: 12, weight: .medium, design: .rounded))
                                        .foregroundColor(habit.completed ? ZenfloColors.textSecondary : ZenfloColors.textPrimary)
                                        .strikethrough(habit.completed)
                                        .lineLimit(1)
                                    Spacer()
                                    if habit.currentStreak > 0 && !habit.completed {
                                        HStack(spacing: 1) {
                                            Image(systemName: "flame.fill")
                                                .font(.system(size: 9))
                                            Text("\(habit.currentStreak)")
                                                .font(.system(size: 10, weight: .bold, design: .rounded))
                                        }
                                        .foregroundColor(ZenfloColors.accent)
                                    }
                                }
                            }
                        }
                    }

                    Spacer(minLength: 0)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                // Divider
                Rectangle()
                    .fill(ZenfloColors.surface)
                    .frame(width: 1)

                // Right: Tasks
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 4) {
                        Image(systemName: "checklist")
                            .font(.system(size: 11))
                            .foregroundColor(ZenfloColors.accent)
                        Text("Tasks")
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                            .foregroundColor(ZenfloColors.textPrimary)
                    }

                    if data.pendingTasks.isEmpty {
                        Text("All done!")
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundColor(ZenfloColors.success)
                    } else {
                        ForEach(data.pendingTasks.prefix(4)) { task in
                            Link(destination: URL(string: "zenflo://task/\(task.id)")!) {
                                HStack(spacing: 6) {
                                    Circle()
                                        .fill(priorityColor(task.priority))
                                        .frame(width: 6, height: 6)
                                    Text(task.title)
                                        .font(.system(size: 12, weight: .medium, design: .rounded))
                                        .foregroundColor(ZenfloColors.textPrimary)
                                        .lineLimit(1)
                                }
                            }
                        }

                        if data.pendingTasks.count > 4 {
                            Text("+\(data.pendingTasks.count - 4) more")
                                .font(.system(size: 10, weight: .medium, design: .rounded))
                                .foregroundColor(ZenfloColors.textSecondary)
                        }
                    }

                    Spacer(minLength: 0)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(.horizontal, 4)
        } else {
            emptyStateMedium
        }
    }

    func priorityColor(_ priority: String) -> Color {
        switch priority {
        case "high": return ZenfloColors.danger
        case "medium": return ZenfloColors.warning
        default: return ZenfloColors.textSecondary
        }
    }

    var emptyStateMedium: some View {
        HStack(spacing: 12) {
            Image(systemName: "leaf.fill")
                .font(.system(size: 28))
                .foregroundColor(ZenfloColors.accent)
            VStack(alignment: .leading, spacing: 2) {
                Text("Welcome to zenflo")
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundColor(ZenfloColors.textPrimary)
                Text("Open the app to sync your tasks & habits")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundColor(ZenfloColors.textSecondary)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetURL(URL(string: "zenflo://home"))
    }
}

// MARK: - Widget Configuration

struct ZenfloWidget: Widget {
    let kind: String = "ZenfloWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ZenfloProvider()) { entry in
            Group {
                if #available(iOSApplicationExtension 17.0, *) {
                    ZenfloWidgetEntryView(entry: entry)
                        .containerBackground(ZenfloColors.background, for: .widget)
                } else {
                    ZenfloWidgetEntryView(entry: entry)
                        .background(ZenfloColors.background)
                }
            }
        }
        .configurationDisplayName("zenflo")
        .description("Track your pending tasks and today's habits.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct ZenfloWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: ZenfloEntry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Widget Bundle

@main
struct ZenfloWidgetBundle: WidgetBundle {
    var body: some Widget {
        ZenfloWidget()
    }
}
