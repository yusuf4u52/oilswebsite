import { SITE_URL } from "@/constants/seo";

const AI_CRAWLER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
  "CCBot",
];

export default function robots() {
  const disallow = ["/admin", "/checkout", "/orders", "/profile"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      // Redundant with the wildcard rule above, but listed explicitly so
      // intent for AI assistant/answer-engine crawlers isn't ambiguous.
      { userAgent: AI_CRAWLER_AGENTS, allow: "/", disallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
