"use client";

import type { LocalizedText } from "../../../../domain/i18n/localizedText";
import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import { ActionLedger, ActionLedgerVariant } from "../../../ActionLedger";
import { AnimalGlyph } from "../../../AnimalGlyph";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./PresentedValueView.module.css";

export function PresentedValueView({
  animalId,
  groupName,
  valueName,
  actions,
}: {
  animalId: string;
  groupName: LocalizedText;
  valueName: LocalizedText;
  actions: ReadonlyArray<{ text: string }>;
}) {
  const { language, translate } = useTranslation();

  return (
    <section
      className={styles.screen}
      data-testid="presented-value-screen"
      data-animal={animalId}
    >
      <div className={styles.context}>
        <div className={styles.glyph}>
          <AnimalGlyph animalId={animalId} />
        </div>
        <p className={styles.eyebrow}>
          <span data-testid="presenter-presenting-group">
            {localizedText(language, groupName)}
          </span>{" "}
          {translate(MessageKey.ValuePresentationPresents)}
        </p>
        <h2
          className={styles.valueName}
          data-testid="presenter-presented-value"
        >
          {localizedText(language, valueName)}
        </h2>
      </div>
      <ActionLedger
        actions={actions.map((action, index) => ({
          id: `${index}-${action.text}`,
          text: action.text,
        }))}
        variant={ActionLedgerVariant.Slabs}
        stagger
        actionTestId="presented-action"
      />
    </section>
  );
}
