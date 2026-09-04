import styles from "./CheckMark.module.css";

export function CheckMark({ className }: { className?: string }) {
  return (
    <svg
      className={`${styles.check} ${className ?? ""}`}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8.5l3.2 3L13 4.5" pathLength={1} />
    </svg>
  );
}
