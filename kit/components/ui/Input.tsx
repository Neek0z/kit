import { TextInput, TextInputProps, View, Text } from "react-native";

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
  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-textMuted dark:text-textMuted-dark text-sm font-medium">{label}</Text>
      )}
      <TextInput
        className={`bg-surface dark:bg-surface-dark border rounded-xl px-4 py-4 text-textMain dark:text-textMain-dark text-base
          ${error ? "border-danger" : "border-border dark:border-border-dark"}
          ${className}`}
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {error && (
        <Text className="text-danger text-xs">{error}</Text>
      )}
    </View>
  );
}
