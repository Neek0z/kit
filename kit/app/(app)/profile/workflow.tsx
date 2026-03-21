import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "../../../components/layout";
import { WorkflowStepsSettingsContent } from "../../../components/profile/WorkflowStepsSettingsContent";
import { useTheme } from "../../../lib/theme";

export default function WorkflowParrainSettingsScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View
        style={{
          height: 1,
          marginHorizontal: 32,
          backgroundColor: theme.primary,
          opacity: 0.25,
        }}
      />
      <Header title="Workflow parrain" showBack />
      <WorkflowStepsSettingsContent
        workflowRole="parrain"
        intro="Ces étapes créent des rappels pour toi (parrain) quand un contact passe en statut « Client ». Active ou désactive chaque étape selon ton mode d'accompagnement."
      />
    </SafeAreaView>
  );
}
