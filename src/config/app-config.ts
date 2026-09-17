import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Mine",
  version: packageJson.version,
  copyright: `© ${currentYear}, Mine.`,
  meta: {
    title: "Mine | Personal Hub",
    description: "Mine adalah personal hub PWA pribadi untuk produktivitas, keuangan, jurnal, dan tracking harian.",
  },
};
