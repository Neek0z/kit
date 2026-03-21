import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuthContext } from "../lib/AuthContext";

export default function Index() {
  const { session, loading } = useAuthContext();

  if (loading) {
    return (
      <View className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
        <ActivityIndicator color="#10b981" />
      </View>
    );
  }

  return session ? (
    <Redirect href="/(app)" />
  ) : (
    <Redirect href="/(auth)/login" />
  );
}
