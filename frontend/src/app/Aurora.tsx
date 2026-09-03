import styles from "./Aurora.module.css";

export function Aurora() {
  return (
    <div className={styles.aurora} aria-hidden="true">
      <span className={`${styles.blob} ${styles.blobOne}`} />
      <span className={`${styles.blob} ${styles.blobTwo}`} />
      <span className={`${styles.blob} ${styles.blobThree}`} />
    </div>
  );
}
