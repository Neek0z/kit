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

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setError("Remplis tous les champs.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }
    setLoading(true);
    setError(null);

    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (err) {
      setError(err.message);
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
            <Text className="text-textMuted dark:text-textMuted-dark text-base">Crée ton compte</Text>
          </View>

          {/* Formulaire */}
          <View className="gap-4">
            <Input
              label="Nom complet"
              placeholder="Nom complet"
              value={fullName}
              onChangeText={setFullName}
              autoComplete="name"
            />
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
              placeholder="Mot de passe (6 caractères min.)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />

            {error && <Text className="text-danger text-sm">{error}</Text>}

            <Button
              label="Créer mon compte"
              onPress={handleRegister}
              loading={loading}
            />
          </View>

          {/* Lien connexion */}
          <TouchableOpacity
            className="mt-6 items-center"
            onPress={() => router.back()}
          >
            <Text className="text-textMuted dark:text-textMuted-dark text-sm">
              Déjà un compte ?{" "}
              <Text className="text-primary font-semibold">Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
