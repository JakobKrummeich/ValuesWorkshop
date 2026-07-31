import styles from "./MissingSession.module.css";

export function MissingSession() {
  return (
    <div className={styles.container}>
      <p>
        This link carries no workshop session. Please scan the QR code again.
      </p>
    </div>
  );
}
