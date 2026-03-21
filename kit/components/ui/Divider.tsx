import { View } from "react-native";
import { useTheme } from "../../lib/theme";

interface DividerProps {
  indent?: number;
}

export function Divider({ indent = 0 }: DividerProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: theme.border,
        marginLeft: indent,
      }}
    />
  );
}
