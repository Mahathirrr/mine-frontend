export const SEO_CONFIG = {
  siteUrl: "https://mine.mahathir.site",
  siteName: "Mine",
  locale: "id_ID",
  language: "id",
  defaultTitle: "Mine | Personal Hub",
  defaultDescription:
    "Mine adalah personal hub PWA pribadi untuk produktivitas, keuangan, jurnal, dan tracking harian.",
  ogImagePath: "/logo512.png",
  twitterCard: "summary" as const,
  /** Halaman publik yang boleh masuk sitemap. Kosong = app pribadi, tidak di-index. */
  indexablePaths: [] as readonly string[],
  disallowedPaths: [
    "/dashboard/",
    "/login",
    "/register",
    "/unauthorized",
    "/auth/",
    "/chat",
    "/mail",
    "/api/",
  ] as readonly string[],
} as const;
