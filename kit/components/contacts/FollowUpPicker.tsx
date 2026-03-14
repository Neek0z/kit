import { useState } from "react";
import {
  View,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { Text, Button } from "../ui";

interface FollowUpPickerProps {
  value?: string | null;
  onChange: (date: Date | null) => void;
}

export function FollowUpPicker({ value, onChange }: FollowUpPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(
    value ? new Date(value) : new Date()
  );

  const formatted = value
    ? new Date(value).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const handleChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
      if (date) onChange(date);
    } else {
      if (date) setTempDate(date);
    }
  };

  const QUICK_OPTIONS = [
    { label: "Demain", days: 1 },
    { label: "3 jours", days: 3 },
    { label: "1 semaine", days: 7 },
    { label: "2 semaines", days: 14 },
    { label: "1 mois", days: 30 },
  ];

  const addDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(9, 0, 0, 0);
    onChange(d);
  };

  return (
    <View className="gap-2">
      <Text variant="muted" className="text-sm font-medium">
        Prochaine relance
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {QUICK_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.days}
            onPress={() => addDays(opt.days)}
            className="px-3 py-2 rounded-lg border border-border bg-surface"
          >
            <Text className="text-sm text-textMuted">{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        className="flex-row items-center gap-2 bg-surface border border-border rounded-xl px-4 py-3"
      >
        <Feather
          name="calendar"
          size={16}
          color={value ? "#6ee7b7" : "#475569"}
        />
        <Text
          className={`flex-1 text-sm ${value ? "text-primary" : "text-textMuted"}`}
        >
          {formatted ?? "Choisir une date..."}
        </Text>
        {value && (
          <TouchableOpacity onPress={() => onChange(null)}>
            <Feather name="x" size={16} color="#475569" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {Platform.OS === "ios" && (
        <Modal visible={showPicker} transparent animationType="slide">
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-surface rounded-t-3xl p-6 gap-4">
              <Text variant="h3">Choisir une date</Text>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={new Date()}
                locale="fr-FR"
                textColor="#f1f5f9"
              />
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowPicker(false)}
                  className="flex-1 py-4 items-center border border-border rounded-xl"
                >
                  <Text variant="muted">Annuler</Text>
                </TouchableOpacity>
                <View className="flex-1">
                  <Button
                    label="Confirmer"
                    onPress={() => {
                      onChange(tempDate);
                      setShowPicker(false);
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === "android" && showPicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleChange}
          minimumDate={new Date()}
        />
      )}
    </View>
  );
}
