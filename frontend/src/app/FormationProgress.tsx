"use client";

import { MessageKey } from "../domain/i18n/messages";
import { useTranslation } from "./i18n/useTranslation";
import { ProgressRing } from "./ProgressRing";

export function FormationProgress({ progress }: { progress: number }) {
  const { translate } = useTranslation();

  return (
    <ProgressRing
      fraction={progress}
      label={translate(MessageKey.GroupFormationFormingGroups)}
      testId="formation-progress"
    />
  );
}
