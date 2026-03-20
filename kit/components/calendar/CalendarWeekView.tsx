import { View, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "../ui";
import {
  getStartOfWeek,
  getWeekDays,
  isToday,
  isSameDay,
  getWeekdayLetters,
  dayKey,
} from "./calendarUtils";
import type { AppointmentWithContact } from "../../hooks/useAppointments";
import { useTheme } from "../../lib/theme";

interface CalendarWeekViewProps {
  /** Date quelconque de la semaine affichée */
  weekAnchor: Date;
  selectedDate: Date;
  appointmentsByDay: Record<string, AppointmentWithContact[]>;
  onSelectDate: (date: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export function CalendarWeekView({
  weekAnchor,
  selectedDate,
  appointmentsByDay,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
}: CalendarWeekViewProps) {
  const theme = useTheme();
  const start = getStartOfWeek(weekAnchor);
  const days = getWeekDays(start);
  const letters = getWeekdayLetters();

  return (
    <View style={{ paddingBottom: 16 }}>
      {/* Navigation (mois) */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          paddingHorizontal: 2,
        }}
      >
        <TouchableOpacity onPress={onPrevWeek} style={{ padding: 4 }}>
          <Feather name="chevron-left" size={20} color={theme.primary} />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: theme.textPrimary,
          }}
        >
          {start.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </Text>

        <TouchableOpacity onPress={onNextWeek} style={{ padding: 4 }}>
          <Feather name="chevron-right" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Bande 7 jours compacte */}
      <View style={{ flexDirection: "row", gap: 6 }}>
        {days.map((d, i) => {
          const selected = isSameDay(d, selectedDate);
          const today = isToday(d);
          const key = dayKey(d);
          const hasAppointments = (appointmentsByDay[key]?.length ?? 0) > 0;

          return (
            <TouchableOpacity
              key={d.getTime()}
              onPress={() => onSelectDate(d)}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 10,
                borderRadius: 14,
                backgroundColor: selected ? theme.primary : today ? theme.primaryBg : "transparent",
                borderWidth: today && !selected ? 1 : 0,
                borderColor: theme.primaryBorder,
              }}
              activeOpacity={0.85}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  color: selected
                    ? theme.isDark
                      ? "#0f172a"
                      : "#ffffff"
                    : today
                      ? theme.primary
                      : theme.textMuted,
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
                numberOfLines={1}
              >
                {letters[i]}
              </Text>

              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: selected
                    ? theme.isDark
                      ? "#0f172a"
                      : "#ffffff"
                    : today
                      ? theme.primary
                      : theme.textPrimary,
                  lineHeight: 18,
                }}
              >
                {d.getDate()}
              </Text>

              <View style={{ height: 4, marginTop: 4 }}>
                {hasAppointments && (
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: selected
                        ? theme.isDark
                        ? "#0f172a"
                          : "#ffffff"
                        : theme.primary,
                    }}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
