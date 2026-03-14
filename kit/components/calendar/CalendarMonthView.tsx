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

const MAX_ITEMS_IN_CELL = 2;

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
  const monthStart = getStartOfMonth(monthAnchor);
  const grid = getMonthGrid(monthStart);
  const letters = getWeekdayLetters();

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark overflow-hidden min-h-0">
      {/* Header mois + flèches */}
      <View className="flex-row items-center justify-between px-2 py-3 border-b border-border dark:border-border-dark">
        <TouchableOpacity onPress={onPrevMonth} className="p-2">
          <Feather name="chevron-left" size={24} color="#6ee7b7" />
        </TouchableOpacity>
        <Text variant="h3" className="text-textMain dark:text-textMain-dark capitalize">
          {monthStart.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </Text>
        <TouchableOpacity onPress={onNextMonth} className="p-2">
          <Feather name="chevron-right" size={24} color="#6ee7b7" />
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
              const displayed = dayAppointments.slice(0, MAX_ITEMS_IN_CELL);
              const rest = dayAppointments.length - MAX_ITEMS_IN_CELL;

              return (
                <TouchableOpacity
                  key={d.getTime()}
                  activeOpacity={0.8}
                  onPress={() => onSelectDate(d)}
                  className="flex-1 border border-border/50 dark:border-border-dark/50 p-0.5 min-w-0"
                  style={{
                    backgroundColor: selected
                      ? "rgba(110, 231, 183, 0.35)"
                      : today
                        ? "rgba(110, 231, 183, 0.12)"
                        : "transparent",
                  }}
                >
                  {/* Numéro du jour */}
                  <View className="items-end pr-1 pt-0.5">
                    <Text
                      numberOfLines={1}
                      className={`text-xs font-semibold ${
                        !inMonth
                          ? "text-textMuted dark:text-textMuted-dark opacity-50"
                          : selected
                            ? "text-primary"
                            : today
                              ? "text-primary"
                              : "text-textMain dark:text-textMain-dark"
                      }`}
                    >
                      {d.getDate()}
                    </Text>
                  </View>

                  {/* RDV dans la case */}
                  <View className="flex-1 mt-0.5 min-h-0">
                    {displayed.map((a) => {
                      const at = new Date(a.scheduled_at);
                      const title = (a.title || "RDV").slice(0, 10);
                      return (
                        <TouchableOpacity
                          key={a.id}
                          activeOpacity={0.9}
                          onPress={(e) => {
                            e.stopPropagation();
                            onAppointmentPress(a);
                          }}
                          className="mb-0.5 rounded pl-1.5 pr-1 py-0.5 flex-row items-center overflow-hidden"
                          style={{ backgroundColor: "rgba(110, 231, 183, 0.25)" }}
                        >
                          <View style={{ width: 3, height: 12, backgroundColor: "#6ee7b7", marginRight: 4, borderRadius: 2 }} />
                          <Text
                            numberOfLines={1}
                            className="text-[10px] font-medium text-textMain dark:text-textMain-dark flex-1"
                          >
                            {at.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}{" "}
                            {title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    {rest > 0 && (
                      <Text
                        variant="muted"
                        className="text-[10px] px-1"
                        numberOfLines={1}
                      >
                        +{rest}
                      </Text>
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
