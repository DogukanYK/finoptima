// Kullanıcının seçebileceği fontlar (Google Fonts'tan dinamik yüklenir)

export const HEADING_FONTS = [
  "Plus Jakarta Sans",
  "Inter",
  "Sora",
  "Manrope",
  "Poppins",
  "Space Grotesk",
  "Outfit",
  "DM Serif Display",
  "Lora",
] as const;

export const BODY_FONTS = [
  "Inter",
  "Plus Jakarta Sans",
  "Manrope",
  "Roboto",
  "Open Sans",
  "Nunito Sans",
  "DM Sans",
  "Source Sans 3",
  "IBM Plex Sans",
] as const;

// Tüm benzersiz fontlar — Google Fonts link'i için
export const ALL_FONTS = Array.from(
  new Set<string>([...HEADING_FONTS, ...BODY_FONTS]),
);

export function googleFontsHref(): string {
  const families = ALL_FONTS.map(
    (f) => `family=${f.replace(/ /g, "+")}:wght@300;400;500;600;700;800`,
  ).join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
