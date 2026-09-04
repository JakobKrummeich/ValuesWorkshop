"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import { PresentationPositionKind } from "../../../../domain/presentationPosition";
import type { FacilitatorValuePresentationState } from "../../../../domain/workshopState";
import { AnimalGlyph } from "../../../AnimalGlyph";
import { useTranslation } from "../../../i18n/useTranslation";
import { ControlButton } from "../../ControlButton";
import { IntentRejection } from "../../IntentRejection";
import styles from "./FacilitatorValuePresentationScreen.module.css";
import { PresentedActionEditor } from "./PresentedActionEditor";
import { useFacilitatorValuePresentationScreen } from "./useFacilitatorValuePresentationScreen";

export function FacilitatorValuePresentationScreen({
  state,
}: {
  state: FacilitatorValuePresentationState;
}) {
  const { language, translate } = useTranslation();
  const {
    position,
    isNextValueEnabled,
    isSending,
    rejectionMessage,
    goToNextValue,
    correctActionWording,
  } = useFacilitatorValuePresentationScreen(state);

  return (
    <section
      className={styles.screen}
      data-testid="facilitator-value-presentation-screen"
    >
      {position !== null && (
        <div className={styles.card} data-animal={position.animalId}>
          <header className={styles.header}>
            <span className={styles.badge}>
              <AnimalGlyph animalId={position.animalId} />
            </span>
            <p className={styles.position} data-testid="presenting-position">
              {position.kind === PresentationPositionKind.GroupIntro
                ? translate(MessageKey.ValuePresentationUpNextGroup, {
                    group: localizedText(language, position.groupName),
                  })
                : translate(MessageKey.ValuePresentationPresenting, {
                    group: localizedText(language, position.groupName),
                    value: localizedText(language, position.valueName),
                  })}
            </p>
          </header>
          {position.kind === PresentationPositionKind.PresentedValue && (
            <>
              <ul className={styles.actions}>
                {position.actions.map((action) => (
                  <li key={action.actionId} className={styles.action}>
                    <PresentedActionEditor
                      key={`${action.actionId}:${action.text}`}
                      action={action}
                      onCorrect={correctActionWording}
                    />
                  </li>
                ))}
              </ul>
              <p className={styles.hint}>
                {translate(MessageKey.ValuePresentationEditHint)}
              </p>
            </>
          )}
        </div>
      )}
      <div className={styles.controls}>
        <ControlButton
          testId="next-value-button"
          isDisabled={isSending || !isNextValueEnabled}
          onClick={goToNextValue}
        >
          {translate(MessageKey.ValuePresentationNextValue)}
        </ControlButton>
        <IntentRejection message={rejectionMessage} />
      </div>
    </section>
  );
}
