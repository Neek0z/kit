import { useState } from "react";
import { View, ScrollView, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ExpoContacts from "expo-contacts";
import { Feather } from "@expo/vector-icons";
import { Text, Input, Button } from "../../../components/ui";
import { Header } from "../../../components/layout";
import { TagsEditor } from "../../../components/contacts";
import { useContacts } from "../../../hooks/useContacts";
import { useToast } from "../../../lib/ToastContext";
import { PipelineStatus, PIPELINE_LABELS } from "../../../types";
import { useTheme } from "../../../lib/theme";

const STATUSES = Object.entries(PIPELINE_LABELS) as [PipelineStatus, string][];

export default function NewContactScreen() {
  const { createContact } = useContacts();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<PipelineStatus>("new");
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Le nom est obligatoire.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);

    const contact = await createContact({
      full_name: fullName.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      status,
      tags: tags.length > 0 ? tags : undefined,
    });

    setLoading(false);

    if (contact) {
      showToast("Contact créé");
      router.replace(`/(app)/contacts/${contact.id}`);
    } else {
      Alert.alert("Erreur", "Impossible de créer le contact.");
    }
  };

  const handleImportFromPhone = async () => {
    const { status: permStatus } =
      await ExpoContacts.requestPermissionsAsync();
    if (permStatus !== "granted") {
      Alert.alert(
        "Permission refusée",
        "Autorise KIT à accéder à tes contacts dans les réglages."
      );
      return;
    }

    const { data } = await ExpoContacts.getContactsAsync({
      fields: [
        ExpoContacts.Fields.Name,
        ExpoContacts.Fields.PhoneNumbers,
        ExpoContacts.Fields.Emails,
      ],
    });

    if (data.length > 0) {
      const picked = data[0];
      setFullName(picked.name ?? "");
      setPhone(picked.phoneNumbers?.[0]?.number ?? "");
      setEmail(picked.emails?.[0]?.email ?? "");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <Header title="Nouveau contact" showBack />

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={handleImportFromPhone}
          className="flex-row items-center gap-2 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-4 py-3 mb-6"
        >
          <Feather name="smartphone" size={16} color={theme.primary} />
          <Text className="text-primary text-sm font-medium">
            Importer depuis mes contacts
          </Text>
        </TouchableOpacity>

        <View className="gap-4 pb-8">
          <Input
            label="Nom complet *"
            placeholder="Jean Dupont"
            value={fullName}
            onChangeText={setFullName}
            error={errors.fullName}
            autoCapitalize="words"
          />
          <Input
            label="Téléphone"
            placeholder="+33 6 12 34 56 78"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Input
            label="Email"
            placeholder="jean@exemple.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View className="gap-1.5">
            <Text variant="muted" className="text-sm font-medium">
              Statut
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {STATUSES.map(([value, label]) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setStatus(value)}
                  className={`px-3 py-2 rounded-lg border ${
                    status === value
                      ? "bg-primary/10 border-primary"
                      : "bg-surface dark:bg-surface-dark border-border dark:border-border-dark"
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      status === value
                        ? "text-primary font-semibold"
                        : "text-textMuted dark:text-textMuted-dark"
                    }`}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TagsEditor tags={tags} onChange={setTags} />

          <Input
            label="Notes"
            placeholder="Notes sur ce contact..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            className="min-h-[96px]"
          />

          <Button
            label="Enregistrer le contact"
            onPress={handleSave}
            loading={loading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
