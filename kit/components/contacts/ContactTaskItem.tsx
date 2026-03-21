import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../lib/theme";
import type { ContactTask, TaskPriority } from "../../types";
import { PRIORITY_COLORS } from "../../types";

interface ContactTaskItemProps {
  task: ContactTask;
  onToggle: () => void;
  onDelete: () => void;
}

const ContactTaskItem = React.memo(function ContactTaskItem({ task, onToggle, onDelete }: ContactTaskItemProps) {
  const theme = useTheme();
  const isCompleted = !!task.completed_at;
  const priorityColor = PRIORITY_COLORS[task.priority as TaskPriority] ?? theme.primary;
  const isOverdue =
    !isCompleted && !!task.due_date && new Date(task.due_date).getTime() < new Date().getTime();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
      }}
    >
      {/* Checkbox */}
      <TouchableOpacity
        onPress={onToggle}
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: isCompleted ? theme.primary : theme.border,
          backgroundColor: isCompleted ? theme.primaryBg : "transparent",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        accessibilityLabel={isCompleted ? "Marquer comme en cours" : "Marquer comme terminée"}
      >
        {isCompleted && <Feather name="check" size={13} color={theme.primary} />}
      </TouchableOpacity>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            color: isCompleted ? theme.textMuted : theme.textPrimary,
            textDecorationLine: isCompleted ? "line-through" : "none",
            fontWeight: "500",
          }}
        >
          {task.title}
        </Text>

        {task.due_date && (
          <Text
            style={{
              fontSize: 11,
              color: isOverdue ? "#f87171" : theme.textMuted,
              marginTop: 2,
            }}
          >
            {isOverdue ? "⚠ " : ""}
            {new Date(task.due_date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </Text>
        )}
      </View>

      {/* Priority dot */}
      {!isCompleted && task.priority !== "normal" && (
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: priorityColor,
          }}
        />
      )}

      {/* Delete */}
      <TouchableOpacity
        onPress={onDelete}
        style={{ padding: 4 }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Supprimer la tâche"
      >
        <Feather name="x" size={14} color={theme.textHint} />
      </TouchableOpacity>
    </View>
  );
});

export { ContactTaskItem };

