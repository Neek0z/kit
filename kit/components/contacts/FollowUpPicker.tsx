import { useState } from "react";
import {
  View,
  TouchableOpacity,
  Modal,
  Platform,
  Text as RNText,
} from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../lib/theme";

interface FollowUpPickerProps {
  value?: string | null;
  onChange: (date: Date | null) => void;
}

export function FollowUpPicker({ value, onChange }: FollowUpPickerProps) {
  const theme = useTheme();
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

  const openAndroidDatePicker = async () => {
    try {
      const { action, year, month, day } =
        await DateTimePickerAndroid.open({
          value: tempDate,
          mode: "date",
          minimumDate: new Date(),
        });
      if (action === "dismissedAction") return;
      const d = new Date(year!, month!, day!);
      d.setHours(12, 0, 0, 0);
      onChange(d);
    } catch {}
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
    <View style={{ gap: 10 }}>
      <RNText
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: theme.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        Prochaine relance
      </RNText>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {QUICK_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.days}
            onPress={() => addDays(opt.days)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 100,
              backgroundColor: theme.bg,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <RNText
              style={{
                fontSize: 13,
                fontWeight: "500",
                color: theme.textMuted,
              }}
            >
              {opt.label}
            </RNText>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => {
          if (Platform.OS === "android") {
            openAndroidDatePicker();
          } else {
            setShowPicker(true);
          }
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: theme.bg,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 12,
          padding: 14,
        }}
      >
        <Feather
          name="calendar"
          size={16}
          color={value ? theme.primary : theme.textHint}
        />
        <RNText
          style={{
            flex: 1,
            fontSize: 15,
            color: value ? theme.primary : theme.textHint,
            fontWeight: value ? "600" : "400",
          }}
        >
          {formatted ?? "Choisir une date..."}
        </RNText>
        {value && (
          <TouchableOpacity onPress={() => onChange(null)}>
            <Feather name="x" size={16} color={theme.textHint} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {Platform.OS === "ios" && (
        <Modal visible={showPicker} transparent animationType="slide">
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
            onPress={() => setShowPicker(false)}
            activeOpacity={1}
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: theme.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: 34,
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.border,
                alignSelf: "center",
                marginTop: 12,
                marginBottom: 4,
              }}
            />
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 8,
                paddingBottom: 16,
              }}
            >
              <RNText
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: theme.textPrimary,
                }}
              >
                Choisir une date
              </RNText>
            </View>
            <View style={{ paddingHorizontal: 20 }}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={new Date()}
                locale="fr-FR"
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                paddingHorizontal: 20,
                paddingTop: 16,
              }}
            >
              <TouchableOpacity
                onPress={() => setShowPicker(false)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: "center",
                  backgroundColor: theme.bg,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <RNText
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: theme.textMuted,
                  }}
                >
                  Annuler
                </RNText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  onChange(tempDate);
                  setShowPicker(false);
                }}
                style={{
                  flex: 2,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: "center",
                  backgroundColor: theme.primary,
                }}
              >
                <RNText
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: "#fff",
                  }}
                >
                  Confirmer
                </RNText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      
    </View>
  );
}
