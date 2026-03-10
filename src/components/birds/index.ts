import type { ImageSourcePropType } from "react-native";

export const BIRD_IDS = [
  "arara",
  "pica-pau",
  "tucano",
  "beija-flor",
  "pomba",
  "canario",
] as const;

export type BirdId = (typeof BIRD_IDS)[number];

/** Imagens JPEG dos pássaros (substitua os placeholders em assets/birds pelos seus JPEGs). */
export const BIRD_IMAGES: Record<BirdId, ImageSourcePropType> = {
  arara: require("../../../assets/birds/arara.png"),
  "pica-pau": require("../../../assets/birds/pica-pau.png"),
  tucano: require("../../../assets/birds/tucano.png"),
  "beija-flor": require("../../../assets/birds/beija-flor.png"),
  pomba: require("../../../assets/birds/pomba.png"),
  canario: require("../../../assets/birds/canario.png"),
};

export function isBirdId(value: string): value is BirdId {
  return BIRD_IDS.includes(value as BirdId);
}
