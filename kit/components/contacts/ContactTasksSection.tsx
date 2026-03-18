import { useState } from "react";
import { Alert, TouchableOpacity, View, Text as RNText } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../lib/theme";
import { AddTaskSheet } from "./AddTaskSheet";
import { ContactTaskItem } from "./ContactTaskItem";
import { useContactTasks } from "../../hooks/useContactTasks";

interface ContactTasksSectionProps {
  contactId: string;
}

export function ContactTasksSection({ contactId }: ContactTasksSectionProps) {
  const theme = useTheme();
  const {
    pendingTasks,
    completedTasks,
    pendingCount,
    createTask,
    toggleTask,
    deleteTask,
  } = useContactTasks(contactId);

  const [showSheet, setShowSheet] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const handleDelete = (taskId: string, title: string) => {
    Alert.alert(
      "Supprimer la tâche",
      `Supprimer "${title}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteTask(taskId),
        },
      ],
      { cancelable: true }
    );
  };

  const hasAnyTask = pendingTasks.length > 0 || completedTasks.length > 0;

  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: pendingCount > 0 ? theme.borderAccent : theme.border,
        borderRadius: 18,
        padding: 14,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: hasAnyTask ? 12 : 0,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <RNText
            style={{
              fontSize: 11,
              color: theme.textHint,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              fontWeight: "600",
            }}
          >
            Tâches
          </RNText>

          {pendingCount > 0 && (
            <View
              style={{
                backgroundColor: theme.primaryBg,
                borderRadius: 10,
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderWidth: 1,
                borderColor: theme.primaryBorder,
              }}
            >
              <RNText style={{ fontSize: 10, fontWeight: "700", color: theme.primary }}>
                {pendingCount}
              </RNText>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowSheet(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 100,
            backgroundColor: theme.primaryBg,
            borderWidth: 1,
            borderColor: theme.primaryBorder,
          }}
          accessibilityLabel="Ajouter une tâche"
        >
          <Feather name="plus" size={12} color={theme.primary} />
          <RNText style={{ fontSize: 11, fontWeight: "600", color: theme.primary }}>Ajouter</RNText>
        </TouchableOpacity>
      </View>

      {/* Pending tasks */}
      {pendingTasks.length > 0 && (
        <View style={{ gap: 2 }}>
          {pendingTasks.map((task, i) => (
            <View key={task.id}>
              <ContactTaskItem
                task={task}
                onToggle={() => toggleTask(task.id, true)}
                onDelete={() => handleDelete(task.id, task.title)}
              />
              {i < pendingTasks.length - 1 && (
                <View style={{ height: 1, backgroundColor: theme.border }} />
              )}
            </View>
          ))}
        </View>
      )}

      {/* Empty state */}
      {!hasAnyTask && (
        <TouchableOpacity onPress={() => setShowSheet(true)} style={{ paddingVertical: 8 }}>
          <RNText style={{ fontSize: 13, color: theme.textHint }}>
            Aucune tâche — tap pour en ajouter
          </RNText>
        </TouchableOpacity>
      )}

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <View style={{ marginTop: pendingTasks.length > 0 ? 10 : 0 }}>
          <TouchableOpacity
            onPress={() => setShowCompleted(!showCompleted)}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 }}
          >
            <Feather
              name={showCompleted ? "chevron-up" : "chevron-down"}
              size={13}
              color={theme.textHint}
            />
            <RNText style={{ fontSize: 11, color: theme.textHint }}>
              {completedTasks.length} terminée{completedTasks.length > 1 ? "s" : ""}
            </RNText>
          </TouchableOpacity>

          {showCompleted && (
            <View style={{ marginTop: 4, gap: 2 }}>
              {completedTasks.map((task) => (
                <ContactTaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id, false)}
                  onDelete={() => handleDelete(task.id, task.title)}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Sheet */}
      <AddTaskSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        onAdd={async (title, dueDate, priority) => {
          await createTask({ title, due_date: dueDate, priority });
        }}
      />
    </View>
  );
}

