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
  label: string;
}

function TabIcon({ name, color, focused, label }: TabIconProps) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", gap: 3 }}>
      <Feather name={name} size={22} color={color} />
      <Text
        style={{
          fontSize: 10,
          fontWeight: focused ? "600" : "400",
          color,
        }}
      >
        {label}
      </Text>
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
            backgroundColor: isDark ? theme.bg : "#ffffff",
            borderTopWidth: 1,
            borderTopColor: isDark ? theme.border : "#f1f5f9",
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
            <TabIcon name="home" color={color} focused={focused} label="Accueil" />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="users" color={color} focused={focused} label="Contacts" />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (pathname === "/(app)/contacts") {
              return;
            }
            e.preventDefault();
            router.replace("/(app)/contacts");
          },
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="calendar" color={color} focused={focused} label="Agenda" />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="message-circle" color={color} focused={focused} label="Messages" />
          ),
        }}
      />
      <Tabs.Screen
        name="content"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="instagram" color={color} focused={focused} label="Contenu" />
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
            <TabIcon name="user" color={color} focused={focused} label="Profil" />
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
