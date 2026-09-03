import styles from "./PhaseStepMarker.module.css";
import { PhaseStepState } from "./usePhaseStepper";

export function PhaseStepMarker({
  state,
  number,
}: {
  state: PhaseStepState;
  number: number;
}) {
  return (
    <span className={`${styles.marker} ${styles[state]}`} aria-hidden="true">
      {state === PhaseStepState.Done ? (
        <svg viewBox="0 0 16 16" className={styles.check}>
          <path
            d="m3.5 8.5 3 3 6-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        number
      )}
    </span>
  );
}
