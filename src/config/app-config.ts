import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Mine",
  version: packageJson.version,
  copyright: `© ${currentYear}, Mine.`,
  meta: {
    title: "Mine Personal Hub",
    description:
      "Mine is a personal PWA for tracking English (TOEFL/IELTS), fasting, gym, LeetCode, coding skills, interviews, expenses, jobs, subscriptions, tasks, journaling, and documents. Built with TanStack Start and shadcn/ui.",
  },
};
