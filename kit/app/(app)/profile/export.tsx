import { View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  documentDirectory,
  writeAsStringAsync,
  EncodingType,
} from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Text, Button, Card } from "../../../components/ui";
import { Header } from "../../../components/layout";
import { useSubscription } from "../../../hooks/useSubscription";
import { useContacts } from "../../../hooks/useContacts";
import { useTheme } from "../../../lib/theme";

export default function ExportScreen() {
  const { isPro } = useSubscription();
  const { contacts } = useContacts();
  const theme = useTheme();

  const handleExport = async () => {
    if (!isPro) {
      router.push("/(app)/subscription");
      return;
    }

    const headers =
      "Nom,Téléphone,Email,Statut,Prochaine relance,Notes\n";
    const rows = contacts
      .map((c) =>
        [
          `"${c.full_name}"`,
          `"${c.phone ?? ""}"`,
          `"${c.email ?? ""}"`,
          `"${c.status}"`,
          `"${c.next_follow_up ? new Date(c.next_follow_up).toLocaleDateString("fr-FR") : ""}"`,
          `"${(c.notes ?? "").replace(/"/g, '""')}"`,
        ].join(",")
      )
      .join("\n");

    const csv = headers + rows;
    const dir = documentDirectory;
    if (!dir) {
      Alert.alert("Erreur", "Impossible d’accéder au stockage.");
      return;
    }
    const path = `${dir}kit_contacts_${Date.now()}.csv`;

    await writeAsStringAsync(path, csv, {
      encoding: EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, {
        mimeType: "text/csv",
        dialogTitle: "Exporter mes contacts KIT",
      });
    } else {
      Alert.alert("Export", `Fichier enregistré : ${path}`);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Ligne décorative */}
      <View
        style={{
          height: 1,
          marginHorizontal: 32,
          backgroundColor: theme.primary,
          opacity: 0.25,
        }}
      />
      <Header title="Exporter mes données" showBack />
      <View className="px-5 pt-4 gap-4">
        <Card>
          <Text variant="muted" className="text-sm leading-relaxed">
            Exporte tous tes contacts au format CSV, compatible avec Excel,
            Google Sheets et la plupart des CRM.
          </Text>
          <Text variant="muted" className="text-sm mt-2">
            {contacts.length} contact{contacts.length > 1 ? "s" : ""} à exporter
          </Text>
        </Card>

        {!isPro && (
          <Card>
            <Text className="text-sm text-secondary font-semibold mb-1">
              Fonctionnalité Pro
            </Text>
            <Text variant="muted" className="text-sm">
              Passe à Pro pour exporter tes données.
            </Text>
          </Card>
        )}

        <Button
          label={
            isPro ? "Exporter en CSV" : "Passer à Pro pour exporter"
          }
          onPress={handleExport}
        />
      </View>
    </SafeAreaView>
  );
}
