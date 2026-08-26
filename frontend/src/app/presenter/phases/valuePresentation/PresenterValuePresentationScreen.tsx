"use client";

import { localizedText } from "../../../../domain/i18n/localizedText";
import { MessageKey } from "../../../../domain/i18n/messages";
import type { PresenterValuePresentationState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./PresenterValuePresentationScreen.module.css";
import { PresentationPositionKind } from "../../../../domain/presentationPosition";
import { usePresenterValuePresentationScreen } from "./usePresenterValuePresentationScreen";

export function PresenterValuePresentationScreen({
  state,
}: {
  state: PresenterValuePresentationState;
}) {
  const { language, translate } = useTranslation();
  const position = usePresenterValuePresentationScreen(state);

  if (position === null) {
    return null;
  }

  if (position.kind === PresentationPositionKind.GroupIntro) {
    return (
      <section
        className={styles.screen}
        data-testid={`group-intro-${position.animalId}`}
      >
        <p className={styles.upNext}>
          {translate(MessageKey.ValuePresentationUpNext)}
        </p>
        <h2 className={styles.introGroupName}>
          {localizedText(language, position.groupName)}
        </h2>
      </section>
    );
  }

  return (
    <section className={styles.screen} data-testid="presented-value-screen">
      <p
        className={styles.presentingGroup}
        data-testid="presenter-presenting-group"
      >
        {localizedText(language, position.groupName)}
      </p>
      <h2 className={styles.valueName} data-testid="presenter-presented-value">
        {localizedText(language, position.valueName)}
      </h2>
      <p className={styles.actionsHeading}>
        {translate(MessageKey.ValuePresentationActions)}
      </p>
      <ol className={styles.actions}>
        {position.actions.map((action, index) => (
          <li
            key={index}
            className={styles.action}
            data-testid="presented-action"
          >
            {action.text}
          </li>
        ))}
      </ol>
    </section>
  );
}
