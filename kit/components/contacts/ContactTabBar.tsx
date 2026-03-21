import { View, TouchableOpacity, ScrollView, Text } from "react-native";
import { useTheme } from "../../lib/theme";

export type ContactTabKey =
  | "infos"
  | "groupes"
  | "workflow"
  | "relance"
  | "historique";

interface Tab {
  key: ContactTabKey;
  label: string;
  badge?: number;
}

export interface ContactTabBarProps {
  activeTab: ContactTabKey;
  onTabChange: (tab: ContactTabKey) => void;
  badges?: Partial<Record<ContactTabKey, number>>;
  showWorkflow?: boolean;
}

export function ContactTabBar({
  activeTab,
  onTabChange,
  badges = {},
  showWorkflow = false,
}: ContactTabBarProps) {
  const theme = useTheme();

  const tabs: Tab[] = [
    { key: "infos", label: "Infos" },
    { key: "groupes", label: "Groupes" },
    ...(showWorkflow
      ? [
          {
            key: "workflow" as ContactTabKey,
            label: "Workflow",
            badge: badges.workflow,
          },
        ]
      : []),
    { key: "relance", label: "Relances", badge: badges.relance },
    { key: "historique", label: "Historique", badge: badges.historique },
  ];

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        backgroundColor: theme.bg,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 4 }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                borderBottomWidth: 2,
                borderBottomColor: isActive ? theme.primary : "transparent",
                marginBottom: -1,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? "700" : "500",
                  color: isActive ? theme.primary : theme.textMuted,
                }}
              >
                {tab.label}
              </Text>
              {tab.badge !== undefined && tab.badge > 0 && (
                <View
                  style={{
                    backgroundColor: isActive ? theme.primaryBg : theme.surface,
                    borderWidth: 1,
                    borderColor: isActive ? theme.primaryBorder : theme.border,
                    borderRadius: 10,
                    paddingHorizontal: 5,
                    paddingVertical: 1,
                    minWidth: 18,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: isActive ? theme.primary : theme.textMuted,
                    }}
                  >
                    {tab.badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
