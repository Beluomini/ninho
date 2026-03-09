import { Image, View, Text } from "react-native";
import clsx from "clsx";

interface AvatarProps {
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

  return (
    <View
      className={clsx(
        "rounded-full overflow-hidden items-center justify-center bg-primary-light",
        sizeMap[size]
      )}
    >
      {uri ? (
        <Image source={{ uri }} className="w-full h-full" />
      ) : (
        <Text className={clsx("font-bold text-primary", textSizeMap[size])}>
          {initials}
        </Text>
      )}
    </View>
  );
}
