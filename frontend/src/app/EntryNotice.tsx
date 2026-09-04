import { Aurora } from "./Aurora";
import styles from "./EntryNotice.module.css";
import { ScreenCopy } from "./ScreenCopy";

export function EntryNotice({
  heading,
  body,
}: {
  heading?: string;
  body: string;
}) {
  return (
    <div className={styles.notice} role="status">
      <Aurora />
      {heading === undefined ? (
        <p className={styles.line}>{body}</p>
      ) : (
        <ScreenCopy heading={heading} body={body} />
      )}
    </div>
  );
}
