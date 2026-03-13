import { useRef, type ReactNode } from "react";
import { View, Animated, PanResponder, Alert } from "react-native";
import { Trash2 } from "lucide-react-native";

interface SwipeableRowProps {
  children: ReactNode;
  onDelete: () => void;
  confirmTitle: string;
  confirmMsg: string;
  cancelLabel: string;
  deleteLabel: string;
}

const THRESHOLD = 80;

export function SwipeableRow({
  children,
  onDelete,
  confirmTitle,
  confirmMsg,
  cancelLabel,
  deleteLabel,
}: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isSwipingRef = useRef(false);
  const onDeleteRef = useRef(onDelete);
  const confirmTitleRef = useRef(confirmTitle);
  const confirmMsgRef = useRef(confirmMsg);
  const cancelLabelRef = useRef(cancelLabel);
  const deleteLabelRef = useRef(deleteLabel);

  onDeleteRef.current = onDelete;
  confirmTitleRef.current = confirmTitle;
  confirmMsgRef.current = confirmMsg;
  cancelLabelRef.current = cancelLabel;
  deleteLabelRef.current = deleteLabel;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        if (Math.abs(gesture.dx) > 10 && Math.abs(gesture.dy) < 15) {
          isSwipingRef.current = true;
          return true;
        }
        return false;
      },
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        Math.abs(gesture.dx) > 10 && Math.abs(gesture.dy) < 15,
      onPanResponderTerminationRequest: () => !isSwipingRef.current,
      onPanResponderMove: (_, gesture) => {
        translateX.setValue(gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        isSwipingRef.current = false;
        if (Math.abs(gesture.dx) > THRESHOLD) {
          const direction = gesture.dx > 0 ? 1 : -1;
          Animated.timing(translateX, {
            toValue: direction * (THRESHOLD + 20),
            duration: 100,
            useNativeDriver: true,
          }).start(() => {
            Alert.alert(confirmTitleRef.current, confirmMsgRef.current, [
              {
                text: cancelLabelRef.current,
                style: "cancel",
                onPress: () => {
                  Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 40,
                    friction: 8,
                  }).start();
                },
              },
              {
                text: deleteLabelRef.current,
                style: "destructive",
                onPress: () => onDeleteRef.current(),
              },
            ]);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        isSwipingRef.current = false;
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }).start();
      },
    })
  ).current;

  const leftIconOpacity = translateX.interpolate({
    inputRange: [0, 20, 80],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });

  const rightIconOpacity = translateX.interpolate({
    inputRange: [-80, -20, 0],
    outputRange: [1, 0, 0],
    extrapolate: "clamp",
  });

  return (
    <View>
      <View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
        }}
      >
        <Animated.View style={{ opacity: leftIconOpacity }}>
          <Trash2 size={20} color="#EF4444" />
        </Animated.View>
        <Animated.View style={{ opacity: rightIconOpacity }}>
          <Trash2 size={20} color="#EF4444" />
        </Animated.View>
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}
