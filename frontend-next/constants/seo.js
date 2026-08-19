export const SITE_NAME = "Premium Oils";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL).replace(/\/$/, "");

// Product image_url is stored as a same-origin relative path (see
// app/api/admin/upload/route.js). Contexts with no browser base URL of
// their own — JSON-LD, OG/Twitter meta tags — need it made absolute.
export function toAbsoluteUrl(path) {
  return path ? `${SITE_URL}${path}` : path;
}
export const DEFAULT_TITLE = "Premium Oils — Kachi Ghani Cold-Pressed Groundnut, Coconut & Almond Oil Online in India";
export const DEFAULT_DESCRIPTION =
  "Buy 100% natural Kachi Ghani (kacchi ghani) wood-pressed groundnut oil, virgin coconut oil and cold-pressed almond oil online. Shuddh, unrefined oils bottled within 48 hours of pressing and delivered fresh across India.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/media/hero-poster.jpg`;
export const TWITTER_HANDLE = "";

// Spelling variants matter here because Hindi/regional terms get typed
// inconsistently in Roman script — "kachi ghani" is the traditional
// wood/stone press method, most searched for groundnut & mustard oil.
export const DEFAULT_KEYWORDS = [
  "kachi ghani",
  "kacchi ghani",
  "kachhi ghani",
  "kacha ghani oil",
  "कच्ची घानी तेल",
  "kachi ghani groundnut oil",
  "kachi ghani oil online India",
  "lakdi ghani oil",
  "cold pressed oil India",
  "wood pressed oil",
  "मूंगफली का तेल",
  "cold pressed groundnut oil",
  "virgin coconut oil",
  "नारियल तेल",
  "cold pressed almond oil",
  "बादाम तेल",
  "shuddh tel",
  "buy cold pressed oil online",
];
