import { View, Text, FlatList, Pressable, Keyboard, Platform, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useRef } from "react";
import { Check, Trash2 } from "lucide-react-native";
import { useHouseData } from "../../src/hooks/useHouseData";
import { AddItemInput } from "../../src/components/ui/AddItemInput";
import { useSettings } from "../../src/contexts/SettingsContext";
import { useTheme } from "../../src/hooks/useTheme";

const TAB_BAR_HEIGHT = 80;

export default function ShoppingScreen() {
  const { shoppingItems, addShoppingItem, toggleShoppingItem, removeShoppingItem } =
    useHouseData();
  const { t, i } = useSettings();
  const theme = useTheme();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const keyboardBottom = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = Keyboard.addListener(showEvent, (e) => {
      const offset =
        Platform.OS === "ios"
          ? e.endCoordinates.height - TAB_BAR_HEIGHT
          : e.endCoordinates.height;
      Animated.timing(keyboardBottom, {
        toValue: Math.max(0, offset),
        duration: Platform.OS === "ios" ? (e.duration ?? 250) : 200,
        useNativeDriver: false,
      }).start();
    });

    const onHide = Keyboard.addListener(hideEvent, (e) => {
      Animated.timing(keyboardBottom, {
        toValue: 0,
        duration: Platform.OS === "ios" ? (e?.duration ?? 250) : 200,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [keyboardBottom]);

  const pendingCount = shoppingItems.filter((item) => !item.isCompleted).length;

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

      <FlatList
        data={shoppingItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Pressable
                onPress={() => toggleShoppingItem(item.id)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: item.isCompleted ? theme.primary : theme.inactive,
                  backgroundColor: item.isCompleted ? theme.primary : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.isCompleted && <Check size={14} color="#fff" />}
              </Pressable>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: item.isCompleted ? theme.inactive : theme.text,
                    textDecorationLine: item.isCompleted ? "line-through" : "none",
                  }}
                >
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
          </View>
        )}
      />

      {/* Barra flutuante – sobe junto com o teclado */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: keyboardBottom,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 20,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginHorizontal: 12,
            marginBottom: showSuggestions ? 10 : 0,
          }}
        >
          <AddItemInput
            placeholder={t.shopping.addPlaceholder}
            onAdd={addShoppingItem}
            onPlusLongPress={() => setShowSuggestions((v) => !v)}
            theme={theme}
          />
        </View>

        {showSuggestions && (
          <View
            style={{
              marginHorizontal: 12,
              backgroundColor: theme.surface,
              borderRadius: 20,
              padding: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: theme.textLight,
                marginBottom: 10,
              }}
            >
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
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
