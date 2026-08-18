import { SITE_NAME, SITE_URL, DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, DEFAULT_KEYWORDS } from "@/constants/seo";

// Central metadata builder — the Next Metadata API equivalent of the old
// react-helmet-async <SEO> component. Centralized because Next's metadata
// merging REPLACES nested objects like `openGraph`/`twitter` wholesale
// rather than deep-merging them: a page that sets `openGraph: { images }`
// alone silently drops the inherited title/description/url. `title` is
// passed as the short per-page string (not pre-composed with the site
// name) so the root layout's `title.template` can append " | Premium Oils"
// — composing it here too would double it up.
export function pageMetadata({ title, description, path = "/", image, keywords, type = "website" } = {}) {
  const desc = description || DEFAULT_DESCRIPTION;
  const url = `${SITE_URL}${path === "/" ? "" : path}`;
  const ogImage = image || DEFAULT_OG_IMAGE;
  const ogTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;

  return {
    ...(title ? { title } : {}),
    description: desc,
    keywords: keywords || DEFAULT_KEYWORDS,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE_NAME,
      title: ogTitle,
      description: desc,
      url,
      images: [ogImage],
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: desc,
      images: [ogImage],
    },
  };
}
