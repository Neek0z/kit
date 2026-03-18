import { TextInput, TextInputProps, View, Text } from "react-native";
import { useTheme } from "../../lib/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  className = "",
  ...props
}: InputProps & { className?: string }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600" }}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          {
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: error ? theme.borderAccent : theme.border,
            borderRadius: 12,
            padding: 12,
            fontSize: 14,
            color: theme.textPrimary,
          },
          // Keep optional caller-provided nativewind classes (e.g. minHeight).
          // Core design tokens are enforced via inline styles.
        ]}
        placeholderTextColor={theme.textHint}
        className={className}
        {...props}
      />
      {error && (
        <Text style={{ color: theme.primaryBorder, fontSize: 12 }}>{error}</Text>
      )}
    </View>
  );
}
