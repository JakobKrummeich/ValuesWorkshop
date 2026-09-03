"use client";

import { cssCustomProperties } from "../shared/cssCustomProperty";
import styles from "./Confetti.module.css";
import { useConfetti } from "./useConfetti";

const particleCount = 60;

export function Confetti() {
  const particles = useConfetti(particleCount);

  return (
    <div className={styles.confetti} aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className={styles.particle}
          data-hue={particle.hue}
          style={cssCustomProperties({
            "--x": particle.x,
            "--delay": particle.delay,
            "--drift": particle.drift,
            "--spin": particle.spin,
          })}
        />
      ))}
    </div>
  );
}
