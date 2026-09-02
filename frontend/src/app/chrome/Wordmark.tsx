import styles from "./Wordmark.module.css";

export enum WordmarkSize {
  Compact = "compact",
  Regular = "regular",
}

export function Wordmark({ size }: { size: WordmarkSize }) {
  return (
    <span className={`${styles.wordmark} ${styles[size]}`}>
      <svg
        className={styles.mark}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M12 3a9 9 0 0 1 9 9 9 9 0 0 1-9 9H3v-9a9 9 0 0 1 9-9Z"
          fill="currentColor"
          transform="rotate(-45 12 12)"
        />
      </svg>
      <span>Values Workshop</span>
    </span>
  );
}
