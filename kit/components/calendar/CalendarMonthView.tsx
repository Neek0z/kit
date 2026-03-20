import { View, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "../ui";
import {
  getStartOfMonth,
  getMonthGrid,
  isSameDay,
  isToday,
  isCurrentMonth,
  getWeekdayLetters,
  dayKey,
} from "./calendarUtils";
import type { AppointmentWithContact } from "../../hooks/useAppointments";
import { useTheme } from "../../lib/theme";

interface CalendarMonthViewProps {
  monthAnchor: Date;
  selectedDate: Date;
  appointmentsByDay: Record<string, AppointmentWithContact[]>;
  onSelectDate: (date: Date) => void;
  onAppointmentPress: (a: AppointmentWithContact) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function CalendarMonthView({
  monthAnchor,
  selectedDate,
  appointmentsByDay,
  onSelectDate,
  onAppointmentPress,
  onPrevMonth,
  onNextMonth,
}: CalendarMonthViewProps) {
  const theme = useTheme();
  const monthStart = getStartOfMonth(monthAnchor);
  const grid = getMonthGrid(monthStart);
  const letters = getWeekdayLetters();

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark overflow-hidden min-h-0">
      {/* Header mois + flèches */}
      <View className="flex-row items-center justify-between px-2 py-3 border-b border-border dark:border-border-dark">
        <TouchableOpacity onPress={onPrevMonth} className="p-2">
          <Feather name="chevron-left" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text variant="h3" className="text-textMain dark:text-textMain-dark capitalize">
          {monthStart.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </Text>
        <TouchableOpacity onPress={onNextMonth} className="p-2">
          <Feather name="chevron-right" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Ligne L M M J V S D */}
      <View className="flex-row border-b border-border dark:border-border-dark py-2">
        {letters.map((letter, i) => (
          <View key={i} className="flex-1 items-center">
            <Text variant="muted" className="text-xs font-semibold">
              {letter}
            </Text>
          </View>
        ))}
      </View>

      {/* Grille des jours - prend tout l'espace restant (6 lignes) */}
      <View className="flex-1 min-h-0">
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-1 flex-row min-h-0">
            {row.map((d) => {
              const key = dayKey(d);
              const dayAppointments = appointmentsByDay[key] ?? [];
              const selected = isSameDay(d, selectedDate);
              const today = isToday(d);
              const inMonth = isCurrentMonth(d, monthStart);

              return (
                <TouchableOpacity
                  key={d.getTime()}
                  activeOpacity={0.8}
                  onPress={() => onSelectDate(d)}
                  className="flex-1 border border-border/50 dark:border-border-dark/50 p-0.5 min-w-0"
                  style={{
                    backgroundColor: selected
                      ? theme.primary
                      : today
                        ? theme.primaryBg
                        : "transparent",
                  }}
                >
                  {/* Numéro du jour en cercle + points RDV */}
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      alignSelf: "center",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: today && !selected ? 1 : 0,
                      borderColor:
                        today && !selected ? theme.primaryBorder : "transparent",
                      backgroundColor: selected
                        ? theme.primary
                        : today
                          ? theme.primaryBg
                          : "transparent",
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 13,
                        fontWeight: selected || today ? "700" : "600",
                        color: selected
                          ? theme.isDark
                            ? "#0f172a"
                            : "#ffffff"
                          : today
                            ? theme.primary
                            : !inMonth
                              ? theme.textMuted
                              : theme.textPrimary,
                      }}
                    >
                      {d.getDate()}
                    </Text>
                  </View>

                  {/* Indicateurs RDV (max 3) */}
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 2,
                      marginTop: 2,
                      height: 4,
                      alignSelf: "center",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {Array.from({ length: Math.min(3, dayAppointments.length) }).map(
                      (_, i) => (
                        <View
                          // eslint-disable-next-line react/no-array-index-key
                          key={i}
                          style={{
                            width: 3,
                            height: 3,
                            borderRadius: 1.5,
                            backgroundColor: selected
                              ? theme.isDark
                                ? "rgba(15,26,26,0.5)"
                                : "rgba(255,255,255,0.7)"
                              : theme.primary,
                          }}
                        />
                      )
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
