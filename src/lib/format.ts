export function formatEnum(value: string) {
  const text = value.toLowerCase().replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Brand names formatEnum would get wrong ("Tiktok", "Youtube")
const PLATFORM_LABELS: Record<string, string> = {
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  LINKEDIN: "LinkedIn",
  X: "X",
};

export function formatPlatform(value: string) {
  return PLATFORM_LABELS[value] ?? formatEnum(value);
}
