import { Image, View, Text } from "react-native";
import clsx from "clsx";
import { isBirdId, BIRD_IMAGES } from "../birds";

interface AvatarProps {
  /** URL de imagem (http) ou id do pássaro (arara, tucano, etc.) */
  uri?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
};

const textSizeMap = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
};

export function Avatar({ uri, name, size = "md" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isBird = uri && isBirdId(uri);
  const birdSource = isBird ? BIRD_IMAGES[uri as keyof typeof BIRD_IMAGES] : null;
  const isImageUri = uri && uri.startsWith("http");

  return (
    <View
      className={clsx(
        "rounded-full overflow-hidden items-center justify-center bg-primary-light",
        sizeMap[size]
      )}
    >
      {birdSource ? (
        <Image source={birdSource} className="w-full h-full" resizeMode="cover" />
      ) : isImageUri ? (
        <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
      ) : (
        <Text className={clsx("font-bold text-primary", textSizeMap[size])}>
          {initials}
        </Text>
      )}
    </View>
  );
}
