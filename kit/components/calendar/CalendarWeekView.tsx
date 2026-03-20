import { View, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "../ui";
import {
  getStartOfWeek,
  getWeekDays,
  isSameDay,
  isToday,
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
    <View className="bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark overflow-hidden">
      <View className="flex-row items-center justify-between px-2 py-2 border-b border-border dark:border-border-dark">
        <TouchableOpacity onPress={onPrevWeek} className="p-2">
          <Feather name="chevron-left" size={22} color={theme.primary} />
        </TouchableOpacity>
        <Text variant="small" className="text-textMuted dark:text-textMuted-dark capitalize">
          {start.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </Text>
        <TouchableOpacity onPress={onNextWeek} className="p-2">
          <Feather name="chevron-right" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>
      <View className="flex-row px-1 pb-2 pt-1">
        {days.map((d, i) => {
          const selected = isSameDay(d, selectedDate);
          const today = isToday(d);
          const key = dayKey(d);
          const hasAppointments = (appointmentsByDay[key]?.length ?? 0) > 0;
          return (
            <TouchableOpacity
              key={d.getTime()}
              onPress={() => onSelectDate(d)}
              className="flex-1 items-center justify-center py-2 mx-0.5 rounded-xl"
              style={{
                backgroundColor: selected
                  ? theme.primary
                  : today
                    ? theme.primaryBg
                    : "transparent",
                borderWidth: today && !selected ? 1 : 0,
                borderColor:
                  today && !selected ? theme.primaryBorder : "transparent",
              }}
            >
              <Text
                variant="muted"
                className="text-[10px] font-semibold uppercase"
                style={{
                  color: selected
                    ? theme.isDark
                      ? "#0f172a"
                      : "#ffffff"
                    : today
                      ? theme.primary
                      : theme.textMuted,
                }}
                numberOfLines={1}
              >
                {letters[i]}
              </Text>

              <Text
                className="text-sm font-semibold"
                style={{
                  marginTop: 2,
                  color: selected
                    ? theme.isDark
                      ? "#0f172a"
                      : "#ffffff"
                    : today
                      ? theme.primary
                      : theme.textPrimary,
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
                          ? "rgba(15,26,26,0.5)"
                          : "rgba(255,255,255,0.7)"
                        : theme.primary,
                      alignSelf: "center",
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
