import { View, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { Check, Trash2 } from "lucide-react-native";
import { useHouseData } from "../../src/hooks/useHouseData";
import { Card } from "../../src/components/ui/Card";
import { AddItemInput } from "../../src/components/ui/AddItemInput";
import { useSettings } from "../../src/contexts/SettingsContext";
import { useTheme } from "../../src/hooks/useTheme";

export default function ShoppingScreen() {
  const { shoppingItems, addShoppingItem, toggleShoppingItem, removeShoppingItem } =
    useHouseData();
  const { t, i } = useSettings();
  const theme = useTheme();
  const [showSuggestions, setShowSuggestions] = useState(false);

  const pendingCount = shoppingItems.filter((i) => !i.isCompleted).length;

  const defaultItems = Object.values(t.shopping.defaultItems);

  const handleAddSuggestion = (name: string) => {
    addShoppingItem(name);
    setShowSuggestions(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: theme.text }}>
          {t.shopping.title}
        </Text>
        <Text style={{ fontSize: 14, color: theme.textLight, marginTop: 4 }}>
          {i(pendingCount === 1 ? t.shopping.pendingCount_one : t.shopping.pendingCount_other, { count: pendingCount })}
        </Text>
      </View>

      {/* Suggestions */}
      {showSuggestions && (
        <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
          <Card theme={theme}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textLight, marginBottom: 8 }}>
              {t.shopping.suggestions}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {defaultItems.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => handleAddSuggestion(item)}
                  style={{
                    backgroundColor: theme.secondary,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: theme.primary }}>
                    + {item}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>
        </View>
      )}

      {/* Items list */}
      <FlatList
        data={shoppingItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <Card theme={theme}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Pressable
                onPress={() => toggleShoppingItem(item.id)}
                style={{
                  width: 24, height: 24, borderRadius: 6,
                  borderWidth: 2,
                  borderColor: item.isCompleted ? theme.primary : theme.inactive,
                  backgroundColor: item.isCompleted ? theme.primary : "transparent",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                {item.isCompleted && <Check size={14} color="#fff" />}
              </Pressable>

              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 14, fontWeight: "500",
                  color: item.isCompleted ? theme.inactive : theme.text,
                  textDecorationLine: item.isCompleted ? "line-through" : "none",
                }}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: 12, color: theme.textLight }}>
                  {item.quantity} {item.unit}
                </Text>
              </View>

              <Pressable onPress={() => removeShoppingItem(item.id)} style={{ padding: 8 }}>
                <Trash2 size={16} color={theme.inactive} />
              </Pressable>
            </View>
          </Card>
        )}
      />

      {/* Add item */}
      <AddItemInput
        placeholder={t.shopping.addPlaceholder}
        onAdd={addShoppingItem}
        onPlusLongPress={() => setShowSuggestions((v) => !v)}
        theme={theme}
      />
    </SafeAreaView>
  );
}
