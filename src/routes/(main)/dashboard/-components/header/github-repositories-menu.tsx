import { siGithub } from "simple-icons";

import { SimpleIcon } from "@/components/simple-icon";
import { Button } from "@/components/ui/button";

export function GitHubRepositoriesMenu() {
  return (
    <Button
      size="icon"
      aria-label="Open Mine on GitHub"
      nativeButton={false}
      render={<a href="https://github.com/Mahathirrr" target="_blank" rel="noreferrer" />}
    >
      <SimpleIcon icon={siGithub} className="fill-primary-foreground" />
    </Button>
  );
}
