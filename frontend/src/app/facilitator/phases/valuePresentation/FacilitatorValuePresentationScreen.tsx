"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import { PresentationPositionKind } from "../../../../domain/presentationPosition";
import type { FacilitatorValuePresentationState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
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
      {position !== null &&
        (position.kind === PresentationPositionKind.GroupIntro ? (
          <p className={styles.position} data-testid="presenting-position">
            {translate(MessageKey.ValuePresentationUpNextGroup, {
              group: localizedText(language, position.groupName),
            })}
          </p>
        ) : (
          <>
            <p className={styles.position} data-testid="presenting-position">
              {translate(MessageKey.ValuePresentationPresenting, {
                group: localizedText(language, position.groupName),
                value: localizedText(language, position.valueName),
              })}
            </p>
            <ol className={styles.actions}>
              {position.actions.map((action) => (
                <li key={action.actionId} className={styles.action}>
                  <PresentedActionEditor
                    key={`${action.actionId}:${action.text}`}
                    action={action}
                    onCorrect={correctActionWording}
                  />
                </li>
              ))}
            </ol>
          </>
        ))}
      <button
        type="button"
        className={styles.nextButton}
        data-testid="next-value-button"
        disabled={isSending || !isNextValueEnabled}
        onClick={goToNextValue}
      >
        {translate(MessageKey.ValuePresentationNextValue)}
      </button>
      {rejectionMessage !== null && (
        <p className={styles.rejection}>{translate(rejectionMessage)}</p>
      )}
    </section>
  );
}
