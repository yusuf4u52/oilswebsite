/** @type {import('next').NextConfig} */
const nextConfig = {
  // Product images come from our own /api/uploads/[fileId] route as a
  // same-origin relative path (see app/api/admin/upload/route.js) — no
  // remotePatterns needed since next/image never sees an absolute/external
  // image URL.
  //
  // unoptimized: production 500s on every /_next/image request
  // ("Cannot find module './.next/server/pages/_next/image.js'") even
  // though `next build` + `next start` serve it correctly locally — Next 16
  // no longer compiles the image optimizer as a discrete pages/ file
  // (routes-manifest.json has no "images" entry, pages-manifest.json only
  // has 404/500), but the deployment platform's Next.js runtime still
  // requires it at that legacy path. This is a platform-adapter/Next-16
  // version-skew issue, not something fixable from next.config beyond
  // disabling the optimizer. Revisit (remove this) once the platform's
  // Next.js runtime catches up to 16.x's new build output, or confirm via a
  // fresh deploy after the 16.3.3 upgrade before re-enabling.
  images: {
    unoptimized: true,
  },
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
