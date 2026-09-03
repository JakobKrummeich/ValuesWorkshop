import { BrandMark } from "./BrandMark";
import styles from "./Wordmark.module.css";

export enum WordmarkSize {
  Compact = "compact",
  Regular = "regular",
}

export function Wordmark({ size }: { size: WordmarkSize }) {
  return (
    <span className={`${styles.wordmark} ${styles[size]}`}>
      <span className={styles.mark}>
        <BrandMark />
      </span>
      <span>Values Workshop</span>
    </span>
  );
}
