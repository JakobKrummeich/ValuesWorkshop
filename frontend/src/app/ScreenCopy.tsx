import styles from "./ScreenCopy.module.css";

export function ScreenCopy({
  heading,
  body,
}: {
  heading: string;
  body?: string;
}) {
  return (
    <div className={styles.copy}>
      <h2 className={styles.heading}>{heading}</h2>
      {body !== undefined && <p className={styles.body}>{body}</p>}
    </div>
  );
}
