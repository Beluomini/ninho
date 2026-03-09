import { View, Text, KeyboardAvoidingView, Platform, Image, Keyboard, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageCircle, ImageIcon, Mic, Video, Play } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { useRef, useCallback } from "react";
import { useHouseData } from "../../src/hooks/useHouseData";
import { Card } from "../../src/components/ui/Card";
import { Avatar } from "../../src/components/ui/Avatar";
import { ChatInput } from "../../src/components/ui/ChatInput";
import { useSettings } from "../../src/contexts/SettingsContext";
import { useTheme } from "../../src/hooks/useTheme";
import type { MessageMediaType } from "../../src/types";

export default function BulletinScreen() {
  const { house, latestMessage, getUserById, postMessage } = useHouseData();
  const { t, userName, userPhoto } = useSettings();
  const theme = useTheme();
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const author = getUserById(latestMessage.authorId);

  const formatTime = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return t.bulletin.justNow;
    if (diffMin < 60) return `${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
  };

  const mediaIcon = () => {
    switch (latestMessage.mediaType) {
      case "image":
        return <ImageIcon size={28} color={theme.primary} />;
      case "audio":
        return <Mic size={28} color={theme.primary} />;
      case "video":
        return <Video size={28} color={theme.primary} />;
      default:
        return null;
    }
  };

  const mediaLabel = () => {
    switch (latestMessage.mediaType) {
      case "image": return t.bulletin.photoSent;
      case "audio": return t.bulletin.audioSent;
      case "video": return t.bulletin.videoSent;
      default: return "";
    }
  };

  const displayName = author?.id === "u1" ? userName : author?.name ?? "?";
  const displayPhoto = author?.id === "u1" ? userPhoto : author?.avatarUrl;

  const handleSend = useCallback(
    (content: string, mediaType?: MessageMediaType, mediaUrl?: string) => {
      postMessage(content, mediaType ?? "text", mediaUrl);
    },
    [postMessage]
  );

  const handlePickImage = useCallback(async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return null;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return null;
    return result.assets[0].uri;
  }, []);

  const handlePickVideo = useCallback(async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return null;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return null;
    return result.assets[0].uri;
  }, []);

  const handleStartRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") return;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
    } catch (e) {
      console.warn("Failed to start recording", e);
    }
  }, []);

  const handleStopRecording = useCallback(async (): Promise<string | null> => {
    const recording = recordingRef.current;
    if (!recording) return null;
    try {
      await recording.stopAndUnloadAsync();
      recordingRef.current = null;
      const uri = recording.getURI();
      return uri;
    } catch (e) {
      console.warn("Failed to stop recording", e);
      return null;
    }
  }, []);

  const handlePlayAudio = useCallback(async () => {
    if (latestMessage.mediaType !== "audio" || !latestMessage.mediaUrl) return;
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: latestMessage.mediaUrl },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      });
    } catch (e) {
      console.warn("Failed to play audio", e);
    }
  }, [latestMessage.mediaType, latestMessage.mediaUrl]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
          {/* Header */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 24, fontWeight: "800", color: theme.text }}>
              {house.name}
            </Text>
            <View style={{ flexDirection: "row", marginTop: 12, gap: 12 }}>
              {house.members.map((member) => {
                const mName = member.id === "u1" ? userName : member.name;
                const mPhoto = member.id === "u1" ? userPhoto : member.avatarUrl;
                return (
                  <View key={member.id} style={{ alignItems: "center", gap: 4 }}>
                    <Avatar uri={mPhoto} name={mName} size="md" />
                    <Text style={{ fontSize: 11, color: theme.textLight }}>
                      {mName.split(" ")[0]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Main content - single latest message */}
          <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 20 }}>
            <Text style={{
              fontSize: 13, fontWeight: "600", color: theme.textLight,
              marginBottom: 8, textTransform: "uppercase", letterSpacing: 1,
            }}>
              {t.bulletin.lastMessage}
            </Text>

            <Card theme={theme}>
              <View style={{ alignItems: "center", paddingVertical: 24, paddingHorizontal: 12, gap: 16 }}>
                <Avatar uri={displayPhoto} name={displayName} size="lg" />

                {latestMessage.mediaType === "image" && latestMessage.mediaUrl ? (
                  <Image
                    source={{ uri: latestMessage.mediaUrl }}
                    style={{ width: "100%", height: 200, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                ) : latestMessage.mediaType === "video" && latestMessage.mediaUrl ? (
                  <View style={{ width: "100%", alignItems: "center", gap: 8 }}>
                    <Video size={48} color={theme.primary} />
                    <Text style={{ fontSize: 14, color: theme.textLight, fontWeight: "500" }}>
                      {mediaLabel()}
                    </Text>
                  </View>
                ) : latestMessage.mediaType === "audio" ? (
                  <View style={{ alignItems: "center", gap: 8 }}>
                    <View style={{
                      width: 72, height: 72, borderRadius: 36,
                      backgroundColor: theme.secondary,
                      alignItems: "center", justifyContent: "center",
                    }}>
                      {mediaIcon()}
                    </View>
                    <Pressable
                      onPress={handlePlayAudio}
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 8,
                        backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 12,
                        borderRadius: 24,
                      }}
                    >
                      <Play size={20} color="#fff" fill="#fff" />
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                        {t.bulletin.play ?? "Reproduzir"}
                      </Text>
                    </Pressable>
                    <Text style={{ fontSize: 14, color: theme.textLight, fontWeight: "500" }}>
                      {mediaLabel()}
                    </Text>
                  </View>
                ) : latestMessage.mediaType !== "text" ? (
                  <View style={{ alignItems: "center", gap: 8 }}>
                    <View style={{
                      width: 72, height: 72, borderRadius: 36,
                      backgroundColor: theme.secondary,
                      alignItems: "center", justifyContent: "center",
                    }}>
                      {mediaIcon()}
                    </View>
                    <Text style={{ fontSize: 14, color: theme.textLight, fontWeight: "500" }}>
                      {mediaLabel()}
                    </Text>
                  </View>
                ) : null}

                {latestMessage.mediaType === "text" && (
                  <View style={{
                    backgroundColor: theme.secondary, borderRadius: 16,
                    paddingHorizontal: 20, paddingVertical: 16, width: "100%",
                  }}>
                    <MessageCircle size={18} color={theme.primary} style={{ marginBottom: 8 }} />
                    <Text style={{ fontSize: 16, color: theme.text, lineHeight: 24, textAlign: "center" }}>
                      {latestMessage.content}
                    </Text>
                  </View>
                )}

                <View style={{ alignItems: "center", gap: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>
                    {displayName}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textLight }}>
                    {formatTime(latestMessage.createdAt)}
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        </Pressable>

        {/* Chat input */}
        <ChatInput
          placeholder={t.bulletin.placeholder}
          onSend={handleSend}
          theme={theme}
          attachLabels={{
            photo: t.bulletin.attachPhoto,
            video: t.bulletin.attachVideo,
            recording: t.bulletin.recording,
          }}
          onPickImage={handlePickImage}
          onPickVideo={handlePickVideo}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
