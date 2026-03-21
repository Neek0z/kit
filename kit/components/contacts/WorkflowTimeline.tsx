import { useState, useEffect } from "react";
import { View, TouchableOpacity, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { completeWorkflowTask } from "../../lib/workflowService";
import { Text, Card } from "../ui";
import {
  WorkflowTask,
  INTERACTION_ICONS,
  InteractionType,
  type WorkflowRole,
  type FeatherIconName,
} from "../../types";
import { useTheme } from "../../lib/theme";

interface WorkflowTimelineProps {
  contactId: string;
  /** Filtre les tâches : parrain (ton suivi) ou client_arrival (checklist arrivée). */
  workflowRole: WorkflowRole;
  /** Titre de la carte (ex. « Workflow parrain »). */
  sectionTitle: string;
  expanded?: boolean;
  onToggle?: () => void;
}

export function WorkflowTimeline({
  contactId,
  workflowRole,
  sectionTitle,
  expanded = true,
  onToggle,
}: WorkflowTimelineProps) {
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;

    const load = async (isRetry: boolean) => {
      const { data } = await supabase
        .from("workflow_tasks")
        .select("*")
        .eq("contact_id", contactId)
        .eq("workflow_role", workflowRole)
        .order("due_date", { ascending: true });

      if (cancelled) return;

      const list = (data ?? []) as WorkflowTask[];
      setTasks(list);
      setLoading(false);

      // Cas particulier : le workflow vient d'être créé, la première requête
      // peut arriver avant l'insertion. On refait un fetch unique après 800ms.
      if (!isRetry && list.length === 0) {
        retryTimeout = setTimeout(() => {
          load(true);
        }, 800);
      }
    };

    load(false);

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [contactId, workflowRole]);

  const handleComplete = (task: WorkflowTask) => {
    Alert.alert("Marquer comme fait", `Valider "${task.title}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Valider",
        onPress: async () => {
          await completeWorkflowTask(task.id);
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task.id
                ? { ...t, completed_at: new Date().toISOString() }
                : t
            )
          );
        },
      },
    ]);
  };

  if (loading || tasks.length === 0) return null;

  const completed = tasks.filter((t) => t.completed_at);
  const pending = tasks.filter((t) => !t.completed_at);
  const progress = Math.round((completed.length / tasks.length) * 100);

  const header = (
    <View className="flex-row items-center justify-between mb-3">
      <Text
        variant="muted"
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          fontWeight: "600",
          color: theme.textHint,
        }}
      >
        {sectionTitle}
      </Text>

      <View className="flex-row items-center" style={{ gap: 6 }}>
        <Text style={{ fontSize: 12, color: theme.primary, fontWeight: "500" }}>
          {completed.length}/{tasks.length}
        </Text>
        {onToggle && (
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={theme.textHint}
          />
        )}
      </View>
    </View>
  );

  return (
    <Card>
      {onToggle ? (
        <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
          {header}
        </TouchableOpacity>
      ) : (
        header
      )}

      <View
        style={{
          height: 4,
          backgroundColor: "#1e293b",
          borderRadius: 2,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            height: 4,
            backgroundColor: theme.primary,
            borderRadius: 2,
            width: `${progress}%`,
          }}
        />
      </View>

      {expanded && (
        <>
          <View style={{ gap: 12 }}>
            {tasks.map((task, index) => {
              const isCompleted = !!task.completed_at;
              const isOverdue =
                !isCompleted && new Date(task.due_date) < new Date();
              const dueDate = new Date(task.due_date);

              return (
                <View
                  key={task.id}
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <View style={{ alignItems: "center", width: 24 }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: isCompleted
                          ? theme.primary
                          : isOverdue
                          ? "#f8717122"
                          : "#1e293b",
                        borderWidth: 1.5,
                        borderColor: isCompleted
                          ? theme.primary
                          : isOverdue
                          ? "#f87171"
                          : "#334155",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isCompleted ? (
                        <Feather name="check" size={12} color="#0f172a" />
                      ) : (
                        <Feather
                          name={
                            INTERACTION_ICONS[
                              task.interaction_type as InteractionType
                            ] as FeatherIconName
                          }
                          size={11}
                          color={isOverdue ? theme.danger : theme.textMuted}
                        />
                      )}
                    </View>
                    {index < tasks.length - 1 && (
                      <View
                        style={{
                          width: 1,
                          flex: 1,
                          minHeight: 12,
                          backgroundColor: "#1e293b",
                          marginTop: 4,
                        }}
                      />
                    )}
                  </View>

                  <View
                    style={{
                      flex: 1,
                      paddingBottom: index < tasks.length - 1 ? 8 : 0,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "500",
                          color: isCompleted
                            ? theme.textMuted
                            : theme.textPrimary,
                          textDecorationLine: isCompleted
                            ? "line-through"
                            : "none",
                        }}
                      >
                        {task.title}
                      </Text>
                      {!isCompleted && (
                        <TouchableOpacity
                          onPress={() => handleComplete(task)}
                          style={{ padding: 4 }}
                        >
                          <Feather
                            name="check-circle"
                            size={16}
                            color="#475569"
                          />
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text
                      style={{
                        fontSize: 11,
                        color: isOverdue ? theme.primary : theme.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {isCompleted
                        ? `Fait le ${new Date(
                            task.completed_at!
                          ).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}`
                        : isOverdue
                        ? `En retard — prévu le ${dueDate.toLocaleDateString(
                            "fr-FR",
                            { day: "numeric", month: "short" }
                          )}`
                        : dueDate.toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                    </Text>

                    {task.description && !isCompleted && (
                      <Text
                        style={{
                          fontSize: 11,
                          color: theme.textMuted,
                          marginTop: 2,
                        }}
                      >
                        {task.description}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {pending.length === 0 && (
            <View style={{ marginTop: 12, alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: theme.primary }}>
                🎉 Workflow complété !
              </Text>
            </View>
          )}
        </>
      )}
    </Card>
  );
}

