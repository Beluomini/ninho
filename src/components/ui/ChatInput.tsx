import { View, TextInput, Pressable, Text, Animated } from "react-native";
import { Send, Mic, Plus, Image as ImageIcon, Video, X } from "lucide-react-native";
import { useState, useRef, useEffect } from "react";
import type { Theme } from "../../constants/colors";
import type { MessageMediaType } from "../../types";

interface ChatInputProps {
  placeholder?: string;
  onSend: (text: string, mediaType?: MessageMediaType, mediaUrl?: string) => void;
  theme?: Theme;
  attachLabels?: { photo: string; video: string; recording: string };
  /** Picker returns URI or null if cancelled. */
  onPickImage?: () => Promise<string | null>;
  onPickVideo?: () => Promise<string | null>;
  /** Called when user enters recording mode. */
  onStartRecording?: () => void;
  /** Called when user sends recording; returns audio file URI or null. */
  onStopRecording?: () => Promise<string | null>;
}

export function ChatInput({
  placeholder = "Escreva uma mensagem...",
  onSend,
  theme,
  attachLabels,
  onPickImage,
  onPickVideo,
  onStartRecording,
  onStopRecording,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const hasText = text.trim().length > 0;

  useEffect(() => {
    if (!isRecording) {
      pulseAnim.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [isRecording, pulseAnim]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed, "text");
    setText("");
    setShowAttach(false);
  };

  const handleMicPress = async () => {
    if (isRecording) {
      setIsRecording(false);
      const uri = onStopRecording ? await onStopRecording() : null;
      if (uri) onSend(uri, "audio", uri);
      else onSend(attachLabels?.recording ?? "Audio", "audio");
    } else {
      onStartRecording?.();
      setIsRecording(true);
    }
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
  };

  const handleAttach = async (type: "image" | "video") => {
    setShowAttach(false);
    const picker = type === "image" ? onPickImage : onPickVideo;
    const label = type === "image"
      ? (attachLabels?.photo ?? "Photo")
      : (attachLabels?.video ?? "Video");
    if (picker) {
      const uri = await picker();
      if (uri) onSend(label, type, uri);
    } else {
      onSend(label, type);
    }
  };

  const bg = theme?.surface ?? "#FFFFFF";
  const borderColor = theme?.border ?? "#E0E0E0";
  const inputBg = theme?.inputBg ?? "#F3F4F6";
  const textColor = theme?.text ?? "#1A1A1A";
  const inactive = theme?.inactive ?? "#9E9E9E";
  const primary = theme?.primary ?? "#4A7C59";
  const danger = theme?.danger ?? "#EF4444";
  const cardBg = theme?.card ?? "#FFFFFF";

  if (isRecording) {
    return (
      <View style={{
        flexDirection: "row", alignItems: "center",
        backgroundColor: bg, borderTopWidth: 1, borderTopColor: borderColor,
        paddingHorizontal: 16, paddingVertical: 12, gap: 12,
      }}>
        <Pressable onPress={handleCancelRecording} style={{ padding: 4 }}>
          <X size={22} color={danger} />
        </Pressable>

        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Animated.View style={{
            width: 10, height: 10, borderRadius: 5, backgroundColor: danger,
            transform: [{ scale: pulseAnim }],
          }} />
          <Text style={{ fontSize: 14, color: danger, fontWeight: "600" }}>
            {attachLabels?.recording ?? "Recording audio..."}
          </Text>
        </View>

        <Pressable
          onPress={handleMicPress}
          style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: primary,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Send size={18} color="#fff" />
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      {/* Attachment options */}
      {showAttach && (
        <View style={{
          flexDirection: "row", backgroundColor: bg,
          borderTopWidth: 1, borderTopColor: borderColor,
          paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 12,
        }}>
          <Pressable
            onPress={() => handleAttach("image")}
            style={{
              flexDirection: "row", alignItems: "center", gap: 6,
              backgroundColor: cardBg, borderRadius: 20,
              paddingHorizontal: 14, paddingVertical: 8,
              borderWidth: 1, borderColor: borderColor,
            }}
          >
            <ImageIcon size={16} color={primary} />
            <Text style={{ fontSize: 13, fontWeight: "600", color: primary }}>
              {attachLabels?.photo ?? "Photo"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleAttach("video")}
            style={{
              flexDirection: "row", alignItems: "center", gap: 6,
              backgroundColor: cardBg, borderRadius: 20,
              paddingHorizontal: 14, paddingVertical: 8,
              borderWidth: 1, borderColor: borderColor,
            }}
          >
            <Video size={16} color={primary} />
            <Text style={{ fontSize: 13, fontWeight: "600", color: primary }}>
              {attachLabels?.video ?? "Video"}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Input row */}
      <View style={{
        flexDirection: "row", alignItems: "center",
        backgroundColor: bg, borderTopWidth: showAttach ? 0 : 1, borderTopColor: borderColor,
        paddingHorizontal: 12, paddingVertical: 10, gap: 8,
      }}>
        {/* Plus / attachment toggle */}
        <Pressable
          onPress={() => setShowAttach((v) => !v)}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: showAttach ? primary : inputBg,
            alignItems: "center", justifyContent: "center",
          }}
        >
          {showAttach ? (
            <X size={18} color="#fff" />
          ) : (
            <Plus size={20} color={inactive} />
          )}
        </Pressable>

        {/* Text input */}
        <TextInput
          style={{
            flex: 1, backgroundColor: inputBg,
            borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
            fontSize: 14, color: textColor,
          }}
          placeholder={placeholder}
          placeholderTextColor={inactive}
          value={text}
          onChangeText={(t) => { setText(t); if (showAttach) setShowAttach(false); }}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline
          maxLength={500}
        />

        {/* Send (text) or Mic (no text) */}
        <Pressable
          onPress={hasText ? handleSend : handleMicPress}
          style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: primary,
            alignItems: "center", justifyContent: "center",
          }}
        >
          {hasText ? (
            <Send size={18} color="#fff" />
          ) : (
            <Mic size={20} color="#fff" />
          )}
        </Pressable>
      </View>
    </View>
  );
}
