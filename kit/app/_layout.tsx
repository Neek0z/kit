import { useEffect } from "react";
import { View, AppState } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../lib/AuthContext";
import { ThemeProvider, useTheme } from "../lib/ThemeContext";
import { ToastProvider } from "../lib/ToastContext";
import { useNotifications } from "../hooks/useNotifications";
import { updateWidgetData } from "../lib/widgetData";
import { scheduleMorningDigestIfNeeded } from "../lib/notifications";
import { supabase } from "../lib/supabase";
import type { Contact } from "../types";
import "../global.css";

function AppWithNotifications() {
  useNotifications();
  const { isDark } = useTheme();

  useEffect(() => {
    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", session.user.id)
        .order("full_name", { ascending: true });
      if (data) {
        await updateWidgetData(data as Contact[]);
        await scheduleMorningDigestIfNeeded(data as Contact[]);
      }
    };

    run(); // au montage (ouverture de l'app)
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") run();
    });
    return () => sub.remove();
  }, []);

  return (
    <ToastProvider>
      <View className={`flex-1 ${isDark ? "dark" : ""}`}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </ToastProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppWithNotifications />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
