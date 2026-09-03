import styles from "./ScreenCopy.module.css";

export function ScreenCopy({
  heading,
  headingTestId,
  body,
}: {
  heading: string;
  headingTestId?: string;
  body?: string;
}) {
  return (
    <div className={styles.copy}>
      <h2 className={styles.heading} data-testid={headingTestId}>
        {heading}
      </h2>
      {body !== undefined && <p className={styles.body}>{body}</p>}
    </div>
  );
}
