import { Tabs, router, usePathname } from "expo-router";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { PushTokenSync } from "../../components/PushTokenSync";
import { useTheme as useAppTheme } from "../../lib/ThemeContext";
import { useTheme as useDesignTheme } from "../../lib/theme";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

interface TabIconProps {
  name: FeatherName;
  color: string;
  focused: boolean;
  activeColor: string;
}

function TabIcon({ name, color, focused, activeColor }: TabIconProps) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", gap: 6 }}>
      <Feather name={name} size={22} color={color} />
      {focused && (
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: activeColor,
          }}
        />
      )}
    </View>
  );
}

export default function AppLayout() {
  const { isDark } = useAppTheme();
  const theme = useDesignTheme();
  const pathname = usePathname();

  return (
    <>
      <PushTokenSync />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            paddingTop: 6,
            paddingBottom: 6,
            height: 64,
          },
          tabBarActiveTintColor: isDark ? "#6ee7b7" : "#10b981",
          tabBarInactiveTintColor: theme.textHint,
          tabBarShowLabel: false,
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} activeColor={isDark ? "#6ee7b7" : "#10b981"} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="users" color={color} focused={focused} activeColor={isDark ? "#6ee7b7" : "#10b981"} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (pathname.startsWith("/(app)/contacts")) {
              e.preventDefault();
            }
          },
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="calendar" color={color} focused={focused} activeColor={isDark ? "#6ee7b7" : "#10b981"} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="message-circle" color={color} focused={focused} activeColor={isDark ? "#6ee7b7" : "#10b981"} />
          ),
        }}
      />
      <Tabs.Screen
        name="content"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="instagram" color={color} focused={focused} activeColor={isDark ? "#6ee7b7" : "#10b981"} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="user" color={color} focused={focused} activeColor={isDark ? "#6ee7b7" : "#10b981"} />
          ),
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
    </Tabs>
    </>
  );
}
