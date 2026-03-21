import { useState, useEffect } from "react";
import { View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Text, Input, Button } from "../../../components/ui";
import { Header } from "../../../components/layout";
import { useStartConversation } from "../../../hooks/useStartConversation";
import { useTheme } from "../../../lib/theme";

export default function NewConversationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { startConversationByEmail } = useStartConversation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (params.email) setEmail(params.email);
  }, [params.email]);

  const handleStart = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert("Email requis", "Entre l’email de la personne avec qui discuter.");
      return;
    }

    setLoading(true);
    const { conversationId, error } = await startConversationByEmail(trimmed);
    setLoading(false);

    if (error) {
      Alert.alert("Impossible de démarrer", error);
      return;
    }
    if (conversationId) {
      router.replace(`/(app)/messages/${conversationId}`);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <Header title="Nouvelle conversation" showBack />
      <View className="px-5 pt-4 gap-4">
        <Text variant="muted" className="text-sm">
          Entre l’email d’un utilisateur inscrit sur KIT pour démarrer une conversation.
        </Text>
        <Input
          label="Email"
          placeholder="contact@exemple.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button
          label="Démarrer la conversation"
          onPress={handleStart}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}
