import { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Text, Card } from "../../../components/ui";
import { Header } from "../../../components/layout";
import { supabase } from "../../../lib/supabase";
import { useAuthContext } from "../../../lib/AuthContext";
import { WorkflowStep, INTERACTION_LABELS, InteractionType } from "../../../types";

export default function WorkflowSettingsScreen() {
  const { user } = useAuthContext();
  const [steps, setSteps] = useState<WorkflowStep[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("workflow_steps")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order")
      .then(({ data }) => setSteps((data ?? []) as WorkflowStep[]));
  }, [user]);

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
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <Header title="Workflow client" showBack />

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
      >
        <Text variant="muted" className="text-sm leading-relaxed mt-2 mb-4">
          Ces étapes se déclenchent automatiquement quand un contact passe en
          statut "Client".
        </Text>

        <View className="gap-2 pb-8">
          {steps.map((step, index) => (
            <Card key={step.id} padding="sm">
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: step.is_active ? "#6ee7b7" : "#1e293b",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: step.is_active ? "#0f172a" : "#475569",
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
                      color: step.is_active ? "#f1f5f9" : "#475569",
                    }}
                  >
                    {step.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#64748b" }}>
                    J+{step.delay_days} ·{" "}
                    {INTERACTION_LABELS[step.interaction_type as InteractionType]}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => toggleStep(step)}>
                  <Feather
                    name={step.is_active ? "toggle-right" : "toggle-left"}
                    size={24}
                    color={step.is_active ? "#6ee7b7" : "#475569"}
                  />
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

