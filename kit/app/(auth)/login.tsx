import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { Button, Input } from "../../components/ui";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Remplis tous les champs.");
      return;
    }
    setLoading(true);
    setError(null);

    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (err) {
      setError("Email ou mot de passe incorrect.");
    }
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          {/* Header */}
          <View className="mb-10">
            <Text className="text-primary text-4xl font-bold mb-2">KIT</Text>
            <Text className="text-textMuted dark:text-textMuted-dark text-base">
              Connecte-toi à ton compte
            </Text>
          </View>

          {/* Formulaire */}
          <View className="gap-4">
            <Input
              label="Email"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <Input
              label="Mot de passe"
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            {error && <Text className="text-danger text-sm">{error}</Text>}

            <Button label="Se connecter" onPress={handleLogin} loading={loading} />
          </View>

          {/* Lien inscription */}
          <TouchableOpacity
            className="mt-6 items-center"
            onPress={() => router.push("/(auth)/register")}
          >
            <Text className="text-textMuted dark:text-textMuted-dark text-sm">
              Pas de compte ?{" "}
              <Text className="text-primary font-semibold">S'inscrire</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
