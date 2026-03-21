import { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { TextInput } from "react-native";
import * as ExpoContacts from "expo-contacts";
import { Feather } from "@expo/vector-icons";
import { Text, Button, Card } from "../../../components/ui";
import { Header } from "../../../components/layout";
import { useContacts } from "../../../hooks/useContacts";
import { useSubscription } from "../../../hooks/useSubscription";
import { PipelineStatus, PIPELINE_LABELS } from "../../../types";
import { useTheme } from "../../../lib/theme";

const STATUS_MAP: Record<string, PipelineStatus> = {
  new: "new",
  contacted: "contacted",
  interested: "interested",
  follow_up: "follow_up",
  client: "client",
  inactive: "inactive",
};

function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === "," && !inQuotes) || c === "\n" || c === "\r") {
      out.push(cur.trim());
      cur = "";
      if (c !== ",") break;
    } else {
      cur += c;
    }
  }
  if (cur.length) out.push(cur.trim());
  return out;
}

function parseCSV(csv: string): { full_name: string; phone?: string; email?: string; status: PipelineStatus; next_follow_up?: string; notes?: string }[] {
  const lines = csv.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = parseCSVLine(lines[0].replace(/^\uFEFF/, ""));
  const nameIdx = header.findIndex((h) => /nom/i.test(h));
  const phoneIdx = header.findIndex((h) => /t[eé]l/i.test(h));
  const emailIdx = header.findIndex((h) => /email/i.test(h));
  const statusIdx = header.findIndex((h) => /statut/i.test(h));
  const followUpIdx = header.findIndex((h) => /relance|follow/i.test(h));
  const notesIdx = header.findIndex((h) => /notes/i.test(h));
  if (nameIdx < 0) return [];

  const rows: { full_name: string; phone?: string; email?: string; status: PipelineStatus; next_follow_up?: string; notes?: string }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    const full_name = (cells[nameIdx] ?? "").replace(/^"|"$/g, "").trim();
    if (!full_name) continue;
    const phone = phoneIdx >= 0 ? (cells[phoneIdx] ?? "").replace(/^"|"$/g, "").trim() || undefined : undefined;
    const email = emailIdx >= 0 ? (cells[emailIdx] ?? "").replace(/^"|"$/g, "").trim() || undefined : undefined;
    let status: PipelineStatus = "new";
    if (statusIdx >= 0 && cells[statusIdx]) {
      const s = (cells[statusIdx] ?? "").replace(/^"|"$/g, "").toLowerCase();
      status = STATUS_MAP[s] ?? "new";
    }
    let next_follow_up: string | undefined;
    if (followUpIdx >= 0 && cells[followUpIdx]) {
      const raw = (cells[followUpIdx] ?? "").replace(/^"|"$/g, "").trim();
      if (raw) {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) next_follow_up = d.toISOString();
      }
    }
    const notes = notesIdx >= 0 ? (cells[notesIdx] ?? "").replace(/^"|"$/g, "").replace(/""/g, '"').trim() || undefined : undefined;
    rows.push({ full_name, phone, email, status, next_follow_up, notes });
  }
  return rows;
}

export default function ImportContactsScreen() {
  const theme = useTheme();
  const { contacts, createContact, refetch } = useContacts();
  const { checkLimit, isPro } = useSubscription();
  const limit = isPro ? 9999 : 25;
  const canAdd = checkLimit("contacts", contacts.length);
  const remaining = Math.max(0, limit - contacts.length);

  const [source, setSource] = useState<"carnet" | "csv" | null>(null);
  const [deviceContacts, setDeviceContacts] = useState<ExpoContacts.Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingDevice, setLoadingDevice] = useState(false);
  const [importing, setImporting] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvRows, setCsvRows] = useState<ReturnType<typeof parseCSV>>([]);
  const [importResult, setImportResult] = useState<{ done: number; skipped: number } | null>(null);

  const openCarnet = async () => {
    const { status } = await ExpoContacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Autorise KIT à accéder à tes contacts.");
      return;
    }
    setLoadingDevice(true);
    const { data } = await ExpoContacts.getContactsAsync({
      fields: [ExpoContacts.Fields.Name, ExpoContacts.Fields.PhoneNumbers, ExpoContacts.Fields.Emails],
      sort: ExpoContacts.SortTypes.FirstName,
    });
    setDeviceContacts(data ?? []);
    setSelectedIds(new Set());
    setSource("carnet");
    setLoadingDevice(false);
  };

  const toggleCarnetSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const importFromCarnet = async () => {
    if (selectedIds.size === 0) return;
    const toImport = deviceContacts.filter((c) => selectedIds.has(c.id));
    const maxAdd = Math.min(toImport.length, remaining);
    if (!canAdd || maxAdd <= 0) {
      Alert.alert("Limite atteinte", "Passe à Pro pour ajouter plus de contacts.");
      return;
    }
    setImporting(true);
    let done = 0;
    let skipped = 0;
    for (let i = 0; i < toImport.length; i++) {
      if (done >= remaining) {
        skipped += toImport.length - i;
        break;
      }
      const c = toImport[i];
      const name = (c.name ?? "").trim() || "Sans nom";
      const phone = c.phoneNumbers?.[0]?.number?.trim();
      const email = c.emails?.[0]?.email?.trim();
      const created = await createContact({
        full_name: name,
        phone: phone || undefined,
        email: email || undefined,
        status: "new",
      });
      if (created) done++;
      else skipped++;
    }
    setImportResult({ done, skipped });
    setImporting(false);
    refetch();
  };

  const openCSVPaste = () => {
    setCsvText("");
    setCsvRows([]);
    setSource("csv");
    setImportResult(null);
  };

  const parseCSVPreview = () => {
    const rows = parseCSV(csvText);
    setCsvRows(rows);
  };

  const renderDeviceContact = useCallback(
    ({ item }: { item: ExpoContacts.Contact }) => (
      <TouchableOpacity
        onPress={() => toggleCarnetSelection(item.id)}
        className="flex-row items-center gap-3 px-4 py-3 border-b border-border/50 dark:border-border-dark/50"
      >
        <View className="w-5 h-5 rounded border-2 border-border dark:border-border-dark items-center justify-center">
          {selectedIds.has(item.id) && <Feather name="check" size={14} color={theme.primary} />}
        </View>
        <View className="flex-1">
          <Text className="font-medium">{item.name ?? "Sans nom"}</Text>
          {(item.phoneNumbers?.[0]?.number || item.emails?.[0]?.email) && (
            <Text variant="muted" className="text-xs">
              {item.phoneNumbers?.[0]?.number || item.emails?.[0]?.email}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    ),
    [selectedIds, toggleCarnetSelection]
  );

  const importFromCSV = async () => {
    const toImport = csvRows.slice(0, remaining);
    if (toImport.length === 0 && csvRows.length > 0) {
      Alert.alert("Limite atteinte", "Passe à Pro pour ajouter plus de contacts.");
      return;
    }
    if (toImport.length === 0) return;
    setImporting(true);
    let done = 0;
    let skipped = 0;
    for (const row of csvRows) {
      if (done >= remaining) {
        skipped++;
        continue;
      }
      const created = await createContact({
        full_name: row.full_name,
        phone: row.phone,
        email: row.email,
        status: row.status,
        notes: row.notes,
        next_follow_up: row.next_follow_up ?? null,
      });
      if (created) done++;
      else skipped++;
    }
    setImportResult({ done, skipped: skipped + Math.max(0, csvRows.length - remaining - skipped) });
    setImporting(false);
    refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <Header title="Importer des contacts" showBack />

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <Text variant="muted" className="mb-4">
          {remaining} place(s) restante(s) sur ta liste.
        </Text>

        <TouchableOpacity
          onPress={openCarnet}
          disabled={loadingDevice || !canAdd}
          className="flex-row items-center gap-3 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-4 py-4 mb-3"
        >
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <Feather name="smartphone" size={20} color={theme.primary} />
          </View>
          <View className="flex-1">
            <Text className="font-medium">Depuis le carnet</Text>
            <Text variant="muted" className="text-xs">Choisir plusieurs contacts à importer</Text>
          </View>
          {loadingDevice ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Feather name="chevron-right" size={18} color={theme.textHint} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={openCSVPaste}
          disabled={!canAdd}
          className="flex-row items-center gap-3 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-4 py-4 mb-6"
        >
          <View className="w-10 h-10 rounded-full bg-secondary/10 items-center justify-center">
            <Feather name="file-text" size={20} color={theme.primary} />
          </View>
          <View className="flex-1">
            <Text className="font-medium">Depuis un CSV (coller)</Text>
            <Text variant="muted" className="text-xs">Colle un CSV au format export (Nom, Téléphone, Email, Statut…)</Text>
          </View>
          <Feather name="chevron-right" size={18} color={theme.textHint} />
        </TouchableOpacity>

        {source === "csv" && (
          <Card className="mb-4">
            <Text variant="muted" className="text-xs mb-2">
              Colle ton CSV ci-dessous (1ère ligne = en-têtes).
            </Text>
            <TextInput
              value={csvText}
              onChangeText={setCsvText}
              placeholder="Nom,Téléphone,Email,Statut,..."
              placeholderTextColor={theme.textHint}
              className="bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded-xl px-3 py-3 text-textMain dark:text-textMain-dark text-sm min-h-[100px]"
              multiline
              textAlignVertical="top"
            />
            <View className="flex-row gap-2 mt-2">
              <Button label="Analyser le CSV" onPress={parseCSVPreview} variant="secondary" />
              {csvRows.length > 0 && (
                <Button label={`Importer (${Math.min(csvRows.length, remaining)})`} onPress={importFromCSV} loading={importing} />
              )}
            </View>
            {csvRows.length > 0 && (
              <Text variant="muted" className="text-xs mt-2">
                {csvRows.length} ligne(s) prête(s). Max {remaining} avec ton forfait.
              </Text>
            )}
          </Card>
        )}

        {importResult && (
          <Card className="mb-4">
            <Text className="text-primary font-medium">
              Import terminé : {importResult.done} ajouté(s)
              {importResult.skipped > 0 ? `, ${importResult.skipped} ignoré(s)` : ""}.
            </Text>
            <TouchableOpacity onPress={() => router.back()} className="mt-2">
              <Text variant="muted" className="text-sm">Retour aux contacts</Text>
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>

      <Modal visible={source === "carnet"} animationType="slide" onRequestClose={() => setSource(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border dark:border-border-dark">
            <TouchableOpacity onPress={() => setSource(null)}>
              <Text className="text-primary">Annuler</Text>
            </TouchableOpacity>
            <Text className="font-semibold">Sélectionner des contacts</Text>
            <TouchableOpacity
              onPress={importFromCarnet}
              disabled={selectedIds.size === 0 || importing}
            >
              <Text className={selectedIds.size === 0 || importing ? "text-textMuted dark:text-textMuted-dark" : "text-primary font-medium"}>
                Importer ({selectedIds.size})
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={deviceContacts}
            keyExtractor={(item) => item.id}
            renderItem={renderDeviceContact}
            windowSize={10}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            removeClippedSubviews={true}
            keyboardShouldPersistTaps="handled"
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
