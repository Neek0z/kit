import { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text, Card } from "../ui";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/AuthContext";
import {
  WorkflowStep,
  INTERACTION_LABELS,
  InteractionType,
  type WorkflowRole,
} from "../../types";
import { useTheme } from "../../lib/theme";

export interface WorkflowStepsSettingsContentProps {
  workflowRole: WorkflowRole;
  intro: string;
}

export function WorkflowStepsSettingsContent({
  workflowRole,
  intro,
}: WorkflowStepsSettingsContentProps) {
  const { user } = useAuthContext();
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const theme = useTheme();

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    supabase
      .from("workflow_steps")
      .select("*")
      .eq("user_id", user.id)
      .eq("workflow_role", workflowRole)
      .order("sort_order")
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error("Erreur chargement workflow steps :", error.message);
        }
        setSteps((data ?? []) as WorkflowStep[]);
      });

    return () => { mounted = false; };
  }, [user, workflowRole]);

  const toggleStep = async (step: WorkflowStep) => {
    await supabase
      .from("workflow_steps")
      .update({ is_active: !step.is_active })
      .eq("id", step.id);
    setSteps((prev) =>
      prev.map((s) =>
        s.id === step.id ? { ...s, is_active: !s.is_active } : s
      )
    );
  };

  return (
    <>
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
      >
        <Text variant="muted" className="text-sm leading-relaxed mt-2 mb-4">
          {intro}
        </Text>

        {steps.length === 0 ? (
          <Card>
            <Text variant="muted" className="text-sm">
              Aucune étape pour ce workflow. Exécute la migration SQL
              workflow_roles_parrain_client.sql dans Supabase (colonne
              workflow_role sur workflow_steps).
            </Text>
          </Card>
        ) : (
          <View className="gap-2 pb-8">
            {steps.map((step, index) => (
              <Card key={step.id}>
                <View className="flex-row items-center gap-3">
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: step.is_active
                        ? theme.primaryBg
                        : theme.surface,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: step.is_active
                        ? theme.primaryBorder
                        : theme.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: step.is_active
                          ? theme.textPrimary
                          : theme.textMuted,
                      }}
                    >
                      {index + 1}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: step.is_active
                          ? theme.textPrimary
                          : theme.textMuted,
                      }}
                    >
                      {step.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textHint }}>
                      J+{step.delay_days} ·{" "}
                      {
                        INTERACTION_LABELS[
                          step.interaction_type as InteractionType
                        ]
                      }
                    </Text>
                  </View>

                  <TouchableOpacity onPress={() => toggleStep(step)}>
                    <Feather
                      name={step.is_active ? "toggle-right" : "toggle-left"}
                      size={24}
                      color={step.is_active ? theme.primary : "#475569"}
                    />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}
