import { SEO_CONFIG } from "@/config/seo";

type HeadMeta = {
  charSet?: "utf-8";
  title?: string;
  name?: string;
  property?: string;
  content?: string;
};

type HeadLink = {
  rel: string;
  href: string;
  type?: string;
  sizes?: string;
  crossOrigin?: "anonymous";
};

export type RouteHead = {
  meta?: HeadMeta[];
  links?: HeadLink[];
};

type BuildHeadOptions = {
  title?: string;
  description?: string;
  path?: string;
  index?: boolean;
};

function absoluteUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SEO_CONFIG.siteUrl}${normalized}`;
}

export function buildHead(options: BuildHeadOptions = {}): RouteHead {
  const title = options.title ?? SEO_CONFIG.defaultTitle;
  const description = options.description ?? SEO_CONFIG.defaultDescription;
  const canonicalPath = options.path ?? "/";
  const indexable = options.index ?? false;

  const robots = indexable ? "index, follow" : "noindex, nofollow, noarchive, nosnippet";

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: robots },
      { name: "googlebot", content: robots },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SEO_CONFIG.siteName },
      { property: "og:locale", content: SEO_CONFIG.locale },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: absoluteUrl(canonicalPath) },
      { property: "og:image", content: absoluteUrl(SEO_CONFIG.ogImagePath) },
      { name: "twitter:card", content: SEO_CONFIG.twitterCard },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: absoluteUrl(SEO_CONFIG.ogImagePath) },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(canonicalPath) }],
  };
}

export function privatePageHead(options: Omit<BuildHeadOptions, "index"> = {}): RouteHead {
  return buildHead({ ...options, index: false });
}
