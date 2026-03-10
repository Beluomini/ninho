import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Image,
  Keyboard,
  Pressable,
  LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageCircle, Mic, Play, Pause, Volume2, VolumeX } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import {
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
  useAudioPlayerStatus,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from "expo-audio";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import { useCallback, useRef, useEffect } from "react";
import { useHouseData } from "../../src/hooks/useHouseData";
import { Card } from "../../src/components/ui/Card";
import { Avatar } from "../../src/components/ui/Avatar";
import { ChatInput } from "../../src/components/ui/ChatInput";
import { useSettings } from "../../src/contexts/SettingsContext";
import { useTheme } from "../../src/hooks/useTheme";
import type { MessageMediaType } from "../../src/types";
import type { Theme } from "../../src/constants/colors";

function AudioMessagePlayer({
  uri,
  theme,
  playLabel,
}: {
  uri: string;
  theme: Theme;
  playLabel: string;
}) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const isPlaying = status.playing;

  useEffect(() => {
    player.volume = 1.0;
  }, [player]);

  const barWidthRef = useRef(0);
  const duration = status.duration ?? 0;
  const currentTime = status.currentTime ?? 0;
  const atEnd = duration > 0 && (currentTime >= duration - 0.05 || status.didJustFinish);
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  // Ensure playback uses loudspeaker when user starts playing
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      player.pause();
    } else {
      setAudioModeAsync({
        playsInSilentMode: true,
        shouldRouteThroughEarpiece: false,
      }).then(() => {
        if (atEnd) player.seekTo(0);
        player.play();
      }).catch(() => {
        if (atEnd) player.seekTo(0);
        player.play();
      });
    }
  }, [player, isPlaying, atEnd]);

  const handleSeek = useCallback(
    (e: { nativeEvent: { locationX: number } }) => {
      const w = barWidthRef.current;
      if (w <= 0 || duration <= 0) return;
      const frac = Math.max(0, Math.min(1, e.nativeEvent.locationX / w));
      player.seekTo(frac * duration);
    },
    [player, duration]
  );

  const onBarLayout = useCallback((e: LayoutChangeEvent) => {
    barWidthRef.current = e.nativeEvent.layout.width;
  }, []);

  return (
    <View
      style={{
        backgroundColor: theme.secondary,
        borderRadius: 20,
        paddingVertical: 14,
        paddingHorizontal: 18,
        width: "100%",
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: theme.primary + "22",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Mic size={24} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: theme.textLight, marginBottom: 2 }}>
            {playLabel}
          </Text>
          <Text style={{ fontSize: 11, color: theme.textLight, opacity: 0.8 }}>
            {duration > 0
              ? `${Math.floor(currentTime)}s / ${Math.floor(duration)}s`
              : "—"}
          </Text>
        </View>
        <Pressable
          onPress={handlePlayPause}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isPlaying ? (
            <Pause size={20} color="#fff" fill="#fff" />
          ) : (
            <Play size={20} color="#fff" fill="#fff" />
          )}
        </Pressable>
      </View>
      {/* Progress bar - tap to seek */}
      <Pressable
        onLayout={onBarLayout}
        onPress={handleSeek}
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: theme.border ?? "rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${progress * 100}%`,
            borderRadius: 3,
            backgroundColor: theme.primary,
          }}
        />
      </Pressable>
    </View>
  );
}

function VideoMessagePlayer({
  uri,
  theme,
}: {
  uri: string;
  theme: Theme;
}) {
  const player = useVideoPlayer(uri);
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });
  const { muted } = useEvent(player, "mutedChange", { muted: player.muted });

  const toggleMute = useCallback(() => {
    player.muted = !player.muted;
  }, [player]);

  return (
    <View style={{ width: "100%", borderRadius: 12, overflow: "hidden", backgroundColor: "#000" }}>
      <VideoView
        style={{ width: "100%", height: 220 }}
        player={player}
        contentFit="contain"
        nativeControls={false}
      />
      <View
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          flexDirection: "row",
          gap: 8,
        }}
      >
        <Pressable
          onPress={toggleMute}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "rgba(0,0,0,0.6)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {player.muted ? (
            <VolumeX size={22} color="#fff" />
          ) : (
            <Volume2 size={22} color="#fff" />
          )}
        </Pressable>
        <Pressable
          onPress={() => (isPlaying ? player.pause() : player.play())}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "rgba(0,0,0,0.6)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isPlaying ? (
            <Pause size={22} color="#fff" fill="#fff" />
          ) : (
            <Play size={22} color="#fff" fill="#fff" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default function BulletinScreen() {
  const { house, latestMessage, getUserById, postMessage } = useHouseData();
  const { t, userName, userBirdId } = useSettings();
  const theme = useTheme();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const wasRecordingRef = useRef(false);

  const author = getUserById(latestMessage.authorId);

  // Route playback to loudspeaker (not earpiece)
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldRouteThroughEarpiece: false,
    }).catch(() => {});
  }, []);

  // When recording auto-stops at 3 min (forDuration), send the audio
  useEffect(() => {
    if (recorderState.isRecording) {
      wasRecordingRef.current = true;
    } else {
      if (wasRecordingRef.current && recorderState.durationMillis >= 179000) {
        const uri = audioRecorder.uri;
        if (uri) postMessage(uri, "audio", uri);
      }
      wasRecordingRef.current = false;
    }
  }, [recorderState.isRecording, recorderState.durationMillis, audioRecorder, postMessage]);

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

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const displayName = author?.id === "u1" ? userName : author?.name ?? "?";
  const displayBirdId = author?.id === "u1" ? userBirdId : author?.birdId;

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
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) return;
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
        shouldRouteThroughEarpiece: false, // use loudspeaker, not earpiece
      });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record({ forDuration: 180 }); // max 3 minutes
    } catch (e) {
      console.warn("Failed to start recording", e);
    }
  }, [audioRecorder]);

  const handleStopRecording = useCallback(async (): Promise<string | null> => {
    try {
      await audioRecorder.stop();
      return audioRecorder.uri ?? null;
    } catch (e) {
      console.warn("Failed to stop recording", e);
      return null;
    }
  }, [audioRecorder]);

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
                const mBirdId = member.id === "u1" ? userBirdId : member.birdId;
                return (
                  <View key={member.id} style={{ alignItems: "center", gap: 4 }}>
                    <Avatar uri={mBirdId} name={mName} size="md" />
                    <Text style={{ fontSize: 11, color: theme.textLight }}>
                      {mName.split(" ")[0]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Main content - Board card with user header + message by type */}
          <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 20 }}>
            <Card theme={theme} style={{ overflow: "hidden" }}>
              {/* Top: user photo, name, date */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingBottom: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border ?? "rgba(0,0,0,0.06)",
                }}
              >
                <Avatar uri={displayBirdId} name={displayName} size="md" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>
                    {displayName}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textLight, marginTop: 2 }}>
                    {formatDate(latestMessage.createdAt)}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: theme.textLight }}>
                  {formatTime(latestMessage.createdAt)}
                </Text>
              </View>

              {/* Body: different layout per message type */}
              <View style={{ paddingTop: 16, gap: 0 }}>
                {/* Text */}
                {latestMessage.mediaType === "text" && (
                  <View
                    style={{
                      backgroundColor: theme.secondary,
                      borderRadius: 16,
                      paddingHorizontal: 20,
                      paddingVertical: 16,
                      width: "100%",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                      <MessageCircle size={20} color={theme.primary} style={{ marginTop: 2 }} />
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 16,
                          color: theme.text,
                          lineHeight: 24,
                        }}
                      >
                        {latestMessage.content}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Photo */}
                {latestMessage.mediaType === "image" && latestMessage.mediaUrl && (
                  <View style={{ width: "100%", borderRadius: 12, overflow: "hidden" }}>
                    <Image
                      source={{ uri: latestMessage.mediaUrl }}
                      style={{ width: "100%", height: 240, borderRadius: 12 }}
                      resizeMode="cover"
                    />
                    {latestMessage.content ? (
                      <Text
                        style={{
                          fontSize: 14,
                          color: theme.textLight,
                          marginTop: 10,
                          paddingHorizontal: 4,
                        }}
                      >
                        {latestMessage.content}
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* Video */}
                {latestMessage.mediaType === "video" && latestMessage.mediaUrl && (
                  <View style={{ width: "100%" }}>
                    <VideoMessagePlayer uri={latestMessage.mediaUrl} theme={theme} />
                    {latestMessage.content ? (
                      <Text
                        style={{
                          fontSize: 14,
                          color: theme.textLight,
                          marginTop: 10,
                          paddingHorizontal: 4,
                        }}
                      >
                        {latestMessage.content}
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* Audio */}
                {latestMessage.mediaType === "audio" && latestMessage.mediaUrl && (
                  <AudioMessagePlayer
                    uri={latestMessage.mediaUrl}
                    theme={theme}
                    playLabel={t.bulletin.play ?? "Reproduzir"}
                  />
                )}

                {/* Fallback for unknown media type */}
                {latestMessage.mediaType !== "text" &&
                  latestMessage.mediaType !== "image" &&
                  latestMessage.mediaType !== "video" &&
                  latestMessage.mediaType !== "audio" && (
                    <View
                      style={{
                        backgroundColor: theme.secondary,
                        borderRadius: 16,
                        padding: 20,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 14, color: theme.textLight }}>
                        {latestMessage.content || t.bulletin.lastMessage}
                      </Text>
                    </View>
                  )}
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
            recordingMax: t.bulletin.recordingMax,
          }}
          onPickImage={handlePickImage}
          onPickVideo={handlePickVideo}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          recordingState={{
            isRecording: recorderState.isRecording,
            durationMillis: recorderState.durationMillis,
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
