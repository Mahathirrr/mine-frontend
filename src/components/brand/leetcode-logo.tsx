import { cn } from "cn";
import { siLeetcode } from "simple-icons";

import { SimpleIcon } from "@/components/simple-icon";

type LeetCodeLogoProps = {
  className?: string;
};

/** Official LeetCode mark from Simple Icons (simpleicons.org). */
export function LeetCodeLogo({ className }: LeetCodeLogoProps) {
  return (
    <SimpleIcon
      icon={siLeetcode}
      className={cn("size-4 shrink-0 fill-[#FFA116]", className)}
    />
  );
}
