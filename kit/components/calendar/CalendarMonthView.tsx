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
  onAppointmentPress: _onAppointmentPress,
  onPrevMonth,
  onNextMonth,
}: CalendarMonthViewProps) {
  const theme = useTheme();
  const monthStart = getStartOfMonth(monthAnchor);
  const grid = getMonthGrid(monthStart);
  const letters = getWeekdayLetters();

  return (
    <View className="flex-1 min-h-0">
      {/* Header mois + flèches */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 2,
          marginBottom: 12,
        }}
      >
        <TouchableOpacity onPress={onPrevMonth} style={{ padding: 4 }}>
          <Feather name="chevron-left" size={20} color={theme.primary} />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: theme.textPrimary,
          }}
        >
          {monthStart.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </Text>

        <TouchableOpacity onPress={onNextMonth} style={{ padding: 4 }}>
          <Feather name="chevron-right" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Jours de la semaine */}
      <View style={{ flexDirection: "row", marginBottom: 6 }}>
        {letters.map((letter, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: theme.textHint,
                textAlign: "center",
              }}
            >
              {letter}
            </Text>
          </View>
        ))}
      </View>

      {/* Grille compacte */}
      <View style={{ flex: 1 }}>
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={{ flexDirection: "row", flex: 1 }}>
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
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 4,
                    backgroundColor: "transparent",
                  }}
                >
                  {/* Cercle sélection / today */}
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: today && !selected ? 1 : 0,
                      borderColor: theme.primaryBorder,
                      backgroundColor: selected ? theme.primary : today ? theme.primaryBg : "transparent",
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 13,
                        fontWeight: selected || today ? "700" : "400",
                        color: selected
                          ? theme.isDark
                            ? "#0f172a"
                            : "#ffffff"
                          : today
                            ? theme.primary
                            : inMonth
                              ? theme.textPrimary
                              : theme.textMuted,
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
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {Array.from({ length: Math.min(3, dayAppointments.length) }).map((_, i) => (
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
                              : "rgba(255,255,255,0.6)"
                            : theme.primary,
                        }}
                      />
                    ))}
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
