import { colors } from "@/design/tokens";

import type { PracticeSkillTone } from "./data/practiceCatalog";

const dashboard = colors.dashboard;

/** Icon chip colors per skill tone, drawn from the paper/green/gold tokens. */
export const skillToneColors: Record<
  PracticeSkillTone,
  { bg: string; fg: string }
> = {
  green: { bg: dashboard.primaryContainer, fg: dashboard.primary },
  gold: { bg: dashboard.tertiaryContainer, fg: dashboard.tertiaryText },
  sage: { bg: dashboard.secondaryContainer, fg: dashboard.secondary },
};
