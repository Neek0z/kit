import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "../../../components/layout";
import { WorkflowStepsSettingsContent } from "../../../components/profile/WorkflowStepsSettingsContent";
import { useTheme } from "../../../lib/theme";

export default function WorkflowClientArrivalSettingsScreen() {
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
      <Header title="Arrivée client" showBack />
      <WorkflowStepsSettingsContent
        workflowRole="client_arrival"
        intro="Checklist des actions à suivre « côté client » (formalités, documents, rendez-vous d’arrivée). Tu coches ici ce qui est fait ; les rappels t’aident à piloter l’onboarding du client."
      />
    </SafeAreaView>
  );
}
