import { View, TextInput, Pressable } from "react-native";
import { Plus } from "lucide-react-native";
import { useState } from "react";
import type { Theme } from "../../constants/colors";

interface AddItemInputProps {
  placeholder?: string;
  onAdd: (text: string) => void;
  onPlusLongPress?: () => void;
  theme?: Theme;
}

export function AddItemInput({ placeholder = "Adicionar item...", onAdd, onPlusLongPress, theme }: AddItemInputProps) {
  const [text, setText] = useState("");

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText("");
  };

  return (
    <View style={{
      flexDirection: "row", alignItems: "center",
      backgroundColor: theme?.surface ?? "#FFFFFF",
      borderTopWidth: 1, borderTopColor: theme?.border ?? "#E0E0E0",
      paddingHorizontal: 16, paddingVertical: 12, gap: 12,
    }}>
      <TextInput
        style={{
          flex: 1, backgroundColor: theme?.inputBg ?? "#F3F4F6",
          borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
          fontSize: 14, color: theme?.text ?? "#1A1A1A",
        }}
        placeholder={placeholder}
        placeholderTextColor={theme?.inactive ?? "#9E9E9E"}
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleAdd}
        returnKeyType="done"
      />
      <Pressable
        onPress={text.trim() ? handleAdd : onPlusLongPress}
        onLongPress={onPlusLongPress}
        style={{
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: theme?.primary ?? "#4A7C59",
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Plus size={20} color="#fff" />
      </Pressable>
    </View>
  );
}
