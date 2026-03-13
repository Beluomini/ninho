import { useState, useEffect, useRef } from "react";
import { Keyboard } from "react-native";

export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setVisible(true);
      visibleRef.current = true;
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setVisible(false);
      visibleRef.current = false;
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const dismissIfVisible = (): boolean => {
    if (visibleRef.current) {
      Keyboard.dismiss();
      return true;
    }
    return false;
  };

  return { keyboardVisible: visible, dismissIfVisible };
}
