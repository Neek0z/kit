import { useState } from "react";
import { View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";

interface MessageInputProps {
  onSend: (content: string) => Promise<boolean>;
  sending?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  sending = false,
  placeholder = "Écris un message…",
}: MessageInputProps) {
  const [text, setText] = useState("");

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const ok = await onSend(trimmed);
    if (ok) setText("");
  };

  const canSend = text.trim().length > 0 && !sending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View className="flex-row items-end gap-2 px-3 py-2 bg-background dark:bg-background-dark border-t border-border dark:border-border-dark">
        <TextInput
          className="flex-1 bg-surface border border-border rounded-2xl px-4 py-3 text-textMain text-base max-h-28"
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={text}
          onChangeText={setText}
          multiline
          editable={!sending}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          className={`w-11 h-11 rounded-full items-center justify-center ${
            canSend ? "bg-primary" : "bg-surface border border-border"
          }`}
        >
          <Feather
            name="send"
            size={18}
            color={canSend ? "#0f172a" : "#64748b"}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
