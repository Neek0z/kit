import { View } from "react-native";
import { Text } from "../ui";
import { PipelineStatus, PIPELINE_LABELS } from "../../types";

const STATUS_COLORS: Record<PipelineStatus, string> = {
  new: "#475569",
  contacted: "#818cf8",
  interested: "#fbbf24",
  follow_up: "#f87171",
  client: "#10b981",
  inactive: "#1e293b",
};

interface PipelineBarProps {
  byStatus: Partial<Record<PipelineStatus, number>>;
  total: number;
}

const ORDERED: PipelineStatus[] = [
  "new",
  "contacted",
  "interested",
  "follow_up",
  "client",
];

export function PipelineBar({ byStatus, total }: PipelineBarProps) {
  if (total === 0) return null;

  return (
    <View className="gap-3">
      <View className="flex-row h-2 rounded-full overflow-hidden bg-border">
        {ORDERED.map((status) => {
          const count = byStatus[status] ?? 0;
          const pct = (count / total) * 100;
          if (pct === 0) return null;
          return (
            <View
              key={status}
              style={{ flex: pct, backgroundColor: STATUS_COLORS[status] }}
            />
          );
        })}
      </View>

      <View className="flex-row flex-wrap gap-x-4 gap-y-1">
        {ORDERED.map((status) => {
          const count = byStatus[status] ?? 0;
          if (count === 0) return null;
          return (
            <View key={status} className="flex-row items-center gap-1.5">
              <View
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[status] }}
              />
              <Text variant="muted" className="text-xs">
                {PIPELINE_LABELS[status]} ({count})
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
