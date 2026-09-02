"use client";

import type { Phase } from "../../domain/phases";
import { PhaseStepMarker } from "./PhaseStepMarker";
import styles from "./PhaseStepper.module.css";
import { PhaseStepState, usePhaseStepper } from "./usePhaseStepper";

export enum PhaseStepperVariant {
  Wall = "wall",
  Phone = "phone",
  Sidebar = "sidebar",
}

export function PhaseStepper({
  currentPhase,
  variant,
}: {
  currentPhase: Phase | null;
  variant: PhaseStepperVariant;
}) {
  const { label, steps, currentLabel, currentName } =
    usePhaseStepper(currentPhase);

  return (
    <nav className={`${styles.stepper} ${styles[variant]}`} aria-label={label}>
      <p className={styles.headline}>
        <span className={styles.currentLabel} data-testid="phase">
          {currentLabel}
        </span>
        {currentName !== null && (
          <span className={styles.currentName}>{currentName}</span>
        )}
      </p>
      <ol className={styles.steps}>
        {steps.map((step) => (
          <li
            key={step.phase}
            className={`${styles.step} ${styles[step.state]}`}
            aria-current={
              step.state === PhaseStepState.Current ? "step" : undefined
            }
          >
            {variant === PhaseStepperVariant.Sidebar && (
              <PhaseStepMarker state={step.state} number={step.number} />
            )}
            <span className={styles.name}>{step.name}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
