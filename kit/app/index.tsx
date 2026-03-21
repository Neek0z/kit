import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuthContext } from "../lib/AuthContext";
import { useTheme } from "../lib/theme";

export default function Index() {
  const { session, loading } = useAuthContext();
  const theme = useTheme();

  if (loading) {
    return (
      <View className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return session ? (
    <Redirect href="/(app)" />
  ) : (
    <Redirect href="/(auth)/login" />
  );
}
