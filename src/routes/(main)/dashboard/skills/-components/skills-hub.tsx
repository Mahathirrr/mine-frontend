"use client";

import { SkillDomainView } from "./skill-domain-view";
import { SkillsOverview } from "./skills-overview";

type SkillsHubProps = {
  domainId?: number;
};

export function SkillsHub({ domainId }: SkillsHubProps) {
  if (domainId) {
    return <SkillDomainView domainId={domainId} />;
  }
  return <SkillsOverview />;
}
