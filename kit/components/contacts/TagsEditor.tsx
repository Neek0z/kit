import { useState } from "react";
import { View, TouchableOpacity, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "../ui";

interface TagsEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  editable?: boolean;
}

export function TagsEditor({
  tags,
  onChange,
  editable = true,
}: TagsEditorProps) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const t = input.trim().replace(/,/g, "");
    if (!t || tags.includes(t)) {
      setInput("");
      return;
    }
    onChange([...tags, t]);
    setInput("");
  };

  const removeTag = (tag: string) => {
    if (!editable) return;
    onChange(tags.filter((x) => x !== tag));
  };

  return (
    <View className="gap-2">
      <Text variant="muted" className="text-sm font-medium">
        Tags
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {tags.map((tag) => (
          <TouchableOpacity
            key={tag}
            onPress={() => removeTag(tag)}
            disabled={!editable}
            className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${
              editable
                ? "bg-surface dark:bg-surface-dark border-border dark:border-border-dark"
                : "bg-surface dark:bg-surface-dark border-border dark:border-border-dark"
            }`}
          >
            <Text className="text-sm text-textMain dark:text-textMain-dark">{tag}</Text>
            {editable && <Feather name="x" size={12} color="#64748b" />}
          </TouchableOpacity>
        ))}
      </View>
      {editable && (
        <View className="flex-row items-center gap-2 mt-1">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ajouter un tag..."
            placeholderTextColor="#64748b"
            className="flex-1 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-3 py-2 text-textMain dark:text-textMain-dark text-sm"
            onSubmitEditing={addTag}
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={addTag}
            className="bg-primary w-9 h-9 rounded-full items-center justify-center"
          >
            <Feather name="plus" size={18} color="#0f172a" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
