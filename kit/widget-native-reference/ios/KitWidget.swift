import WidgetKit
import SwiftUI

struct FollowUpContact: Identifiable {
    let id = UUID()
    let name: String
}

struct KitEntry: TimelineEntry {
    let date: Date
    let count: Int
    let contacts: [FollowUpContact]
}

struct KitProvider: TimelineProvider {
    func placeholder(in context: Context) -> KitEntry {
        KitEntry(date: Date(), count: 3, contacts: [
            FollowUpContact(name: "Marie Dupont"),
            FollowUpContact(name: "Jean Martin"),
        ])
    }

    func getSnapshot(in context: Context, completion: @escaping (KitEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<KitEntry>) -> Void) {
        let entry = loadEntry()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func loadEntry() -> KitEntry {
        let userDefaults = UserDefaults(suiteName: "group.com.kit.app")
        let count = userDefaults?.integer(forKey: "followUpCount") ?? 0
        let names = userDefaults?.array(forKey: "followUpNames") as? [String] ?? []
        let contacts = names.prefix(3).map { FollowUpContact(name: $0) }
        return KitEntry(date: Date(), count: count, contacts: Array(contacts))
    }
}

struct KitWidgetView: View {
    var entry: KitEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("KIT")
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(Color(hex: "#6ee7b7"))
                .tracking(2)

            Text(entry.count == 0 ? "✓ Tout est à jour" : "\(entry.count) à relancer")
                .font(.system(size: 17, weight: .bold))
                .foregroundColor(.white)
                .padding(.top, 2)

            VStack(alignment: .leading, spacing: 2) {
                ForEach(entry.contacts) { contact in
                    Text(contact.name)
                        .font(.system(size: 13))
                        .foregroundColor(Color(hex: "#94a3b8"))
                }
            }
            .padding(.top, 4)

            Spacer()
        }
        .padding(16)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .containerBackground(Color(hex: "#1e293b"), for: .widget)
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

@main
struct KitWidget: Widget {
    let kind = "KitWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: KitProvider()) { entry in
            KitWidgetView(entry: entry)
        }
        .configurationDisplayName("KIT — Relances")
        .description("Tes contacts à relancer aujourd'hui.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
