/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js streams metadata into <body> by default for JS-executing bots
  // (Googlebot etc. still see it fine) but blocks and renders it in <head>
  // for "HTML-limited" bots that can't run JS. Next's built-in default list
  // (see node_modules/next/dist/shared/lib/router/utils/html-bots.js) covers
  // traditional search/social-preview bots but no AI assistant crawlers —
  // and setting this option overrides that default rather than extending
  // it, so the full list is repeated here plus our additions.
  htmlLimitedBots:
    /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|Claude-User|Claude-SearchBot|PerplexityBot|Perplexity-User|Bytespider|CCBot/i,
};

export default nextConfig;
