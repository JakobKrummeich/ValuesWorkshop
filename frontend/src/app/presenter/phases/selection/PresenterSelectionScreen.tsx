"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { PresenterSelectionState } from "../../../../domain/workshopState";
import { cssCustomProperty } from "../../../../shared/cssCustomProperty";
import { Counter, CounterSize, CounterVariant } from "../../../Counter";
import { Eyebrow } from "../../../Eyebrow";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./PresenterSelectionScreen.module.css";
import { presenterSelectionScreenModelOf } from "./presenterSelectionScreenModel";

export function PresenterSelectionScreen({
  state,
}: {
  state: PresenterSelectionState;
}) {
  const { translate } = useTranslation();
  const { submittedCount, participantCount, progressFraction } =
    presenterSelectionScreenModelOf(state);

  return (
    <section className={styles.screen}>
      <Eyebrow>{translate(MessageKey.SelectionPrompt)}</Eyebrow>
      <Counter
        value={submittedCount}
        suffix={translate(MessageKey.SelectionSubmittedOfTotal, {
          total: participantCount,
        })}
        variant={CounterVariant.Wall}
        size={CounterSize.Giant}
        testId="submitted-count"
      />
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={Math.round(progressFraction * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={styles.fill}
          data-testid="selection-progress-bar"
          style={cssCustomProperty("--progress", progressFraction)}
        />
      </div>
    </section>
  );
}
