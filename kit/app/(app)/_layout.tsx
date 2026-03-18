import { Tabs, router, usePathname } from "expo-router";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { PushTokenSync } from "../../components/PushTokenSync";
import { useTheme as useAppTheme } from "../../lib/ThemeContext";
import { useTheme as useDesignTheme } from "../../lib/theme";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

interface TabIconProps {
  name: FeatherName;
  color: string;
  focused: boolean;
}

function TabIcon({ name, color, focused }: TabIconProps) {
  return (
    <View className="items-center justify-center">
      <Feather name={name} size={22} color={color} />
      {focused && (
        <View className="w-1 h-1 rounded-full bg-primary mt-1" />
      )}
    </View>
  );
}

export default function AppLayout() {
  const { isDark } = useAppTheme();
  const theme = useDesignTheme();
  const tabBarBg = isDark ? theme.bg : theme.surface;
  const tabBarBorder = theme.border;
  const tabBarInactive = theme.textHint;
  const pathname = usePathname();

  return (
    <>
      <PushTokenSync />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: tabBarBg,
            borderTopWidth: 1,
            borderTopColor: tabBarBorder,
            paddingTop: 8,
            paddingBottom: 8,
            height: 64,
          },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: tabBarInactive,
          tabBarShowLabel: false,
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="users" color={color} focused={focused} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            // Si on est déjà sur la page principale Contacts, ne rien faire
            if (pathname === "/(app)/contacts") {
              return;
            }
            // Sinon, empêcher la navigation par défaut et forcer la page principale Contacts
            e.preventDefault();
            router.replace("/(app)/contacts");
          },
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="calendar" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="message-circle" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="content"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="instagram" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="user" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          href: null,
        }}
      />
    </Tabs>
    </>
  );
}
