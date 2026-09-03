import styles from "./BrandMark.module.css";

export function BrandMark() {
  return (
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
  );
}
