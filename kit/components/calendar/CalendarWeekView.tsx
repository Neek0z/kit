import { View, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "../ui";
import {
  getStartOfWeek,
  getWeekDays,
  addWeeks,
  isSameDay,
  isToday,
  getWeekdayLetters,
} from "./calendarUtils";

interface CalendarWeekViewProps {
  /** Date quelconque de la semaine affichée */
  weekAnchor: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export function CalendarWeekView({
  weekAnchor,
  selectedDate,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
}: CalendarWeekViewProps) {
  const start = getStartOfWeek(weekAnchor);
  const days = getWeekDays(start);
  const letters = getWeekdayLetters();

  return (
    <View className="bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark overflow-hidden">
      <View className="flex-row items-center justify-between px-2 py-2 border-b border-border dark:border-border-dark">
        <TouchableOpacity onPress={onPrevWeek} className="p-2">
          <Feather name="chevron-left" size={22} color="#6ee7b7" />
        </TouchableOpacity>
        <Text variant="small" className="text-textMuted dark:text-textMuted-dark capitalize">
          {start.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </Text>
        <TouchableOpacity onPress={onNextWeek} className="p-2">
          <Feather name="chevron-right" size={22} color="#6ee7b7" />
        </TouchableOpacity>
      </View>
      <View className="flex-row px-1 pb-2 pt-1">
        {letters.map((letter, i) => (
          <View key={i} className="flex-1 items-center py-1">
            <Text variant="muted" className="text-xs font-medium">
              {letter}
            </Text>
          </View>
        ))}
      </View>
      <View className="flex-row px-1 pb-2">
        {days.map((d) => {
          const selected = isSameDay(d, selectedDate);
          const today = isToday(d);
          return (
            <TouchableOpacity
              key={d.getTime()}
              onPress={() => onSelectDate(d)}
              className="flex-1 items-center justify-center py-2 mx-0.5 rounded-xl"
              style={{
                backgroundColor: selected ? "#6ee7b7" : today ? "rgba(110, 231, 183, 0.2)" : "transparent",
              }}
            >
              <Text
                className={`text-sm font-semibold ${
                  selected
                    ? "text-onPrimary"
                    : today
                      ? "text-primary"
                      : "text-textMain dark:text-textMain-dark"
                }`}
              >
                {d.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
