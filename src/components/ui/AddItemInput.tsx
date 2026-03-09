import { View, TextInput, Pressable } from "react-native";
import { Plus } from "lucide-react-native";
import { useState } from "react";
import type { Theme } from "../../constants/colors";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface AddItemInputProps {
  placeholder?: string;
  onAdd: (text: string) => void;
  onPlusLongPress?: () => void;
  theme?: Theme;
}

/**
 * Apenas a barra de input + botão (estilo flutuante).
 * O parent deve posicionar e envolver com padding; não desenha container com fundo em volta.
 */
export function AddItemInput({ placeholder = "Adicionar item...", onAdd, onPlusLongPress, theme }: AddItemInputProps) {
  const [text, setText] = useState("");

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText("");
  };

  const surface = theme?.surface ?? "#FFFFFF";
  const surfaceTransparent = hexToRgba(surface, 1);
  const inputBg = theme?.inputBg ?? "#F3F4F6";
  const primary = theme?.primary ?? "#4A7C59";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: surfaceTransparent,
        borderRadius: 28,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <TextInput
        style={{
          flex: 1,
          backgroundColor: inputBg,
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 10,
          fontSize: 14,
          color: theme?.text ?? "#1A1A1A",
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
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Plus size={20} color="#fff" />
      </Pressable>
    </View>
  );
}
