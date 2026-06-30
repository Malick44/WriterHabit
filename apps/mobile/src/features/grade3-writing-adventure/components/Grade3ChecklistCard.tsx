import { CheckboxRow } from "@/shared/components";
import { useI18n } from "@/i18n";

import { Grade3AdventureCard } from "./Grade3AdventureCard";
import type { Grade3ChecklistState } from "../types";

type Grade3ChecklistCardProps = {
  checklist: string[];
  value: Grade3ChecklistState;
  onChange: (next: Grade3ChecklistState) => void;
};

export function Grade3ChecklistCard({ checklist, onChange, value }: Grade3ChecklistCardProps) {
  const { t } = useI18n();

  return (
    <Grade3AdventureCard
      icon="✅"
      subtitle={t("grade3WritingAdventure.lesson.checklistSubtitle")}
      title={t("grade3WritingAdventure.lesson.checklistTitle")}
      variant="success"
    >
      {checklist.map((item) => (
        <CheckboxRow
          checked={value[item] === true}
          gradeBand="elementary"
          key={item}
          label={item}
          onPress={() => onChange({ ...value, [item]: value[item] !== true })}
        />
      ))}
    </Grade3AdventureCard>
  );
}
