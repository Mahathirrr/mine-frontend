import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, ".output", "public");

const SITE_URL = process.env.VITE_SITE_URL ?? "https://mine.mahathir.site";
const INDEXABLE_PATHS = [];

const DISALLOWED = [
  "/dashboard/",
  "/login",
  "/register",
  "/unauthorized",
  "/auth/",
  "/chat",
  "/mail",
  "/api/",
];

const robots = `# https://www.robotstxt.org/robotstxt.html
# Mine is a private personal app. Crawlers should not index app pages.
User-agent: *
${DISALLOWED.map((entry) => `Disallow: ${entry}`).join("\n")}

Sitemap: ${SITE_URL}/sitemap.xml
`;

const sitemap =
  INDEXABLE_PATHS.length === 0
    ? `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>
`
    : `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${INDEXABLE_PATHS.map(
  (entry) => `  <url>
    <loc>${SITE_URL}${entry.startsWith("/") ? entry : `/${entry}`}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`,
).join("\n")}
</urlset>
`;

await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "robots.txt"), robots, "utf8");
await writeFile(path.join(outDir, "sitemap.xml"), sitemap, "utf8");
await writeFile(path.join(root, "public", "robots.txt"), robots, "utf8");
await writeFile(path.join(root, "public", "sitemap.xml"), sitemap, "utf8");

console.log("SEO files generated:", { siteUrl: SITE_URL, indexable: INDEXABLE_PATHS.length });
