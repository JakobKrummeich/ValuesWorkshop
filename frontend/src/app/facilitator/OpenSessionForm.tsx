"use client";

import type { FacilitatorSessionCreationPort } from "../../domain/ports/facilitator/sessionCreationPort";
import { maximumSessionNameLength } from "../../domain/sessionCreation";
import styles from "./OpenSessionForm.module.css";
import { useOpenSessionForm } from "./useOpenSessionForm";

export function OpenSessionForm({
  sessionCreation,
}: {
  sessionCreation: FacilitatorSessionCreationPort;
}) {
  const {
    sessionName,
    passphrase,
    errorMessage,
    isSubmitting,
    changeSessionName,
    changePassphrase,
    submit,
  } = useOpenSessionForm(sessionCreation);

  return (
    <div className={styles.screen}>
      <section className={styles.card}>
        <h1 className={styles.title}>ValuesWorkshop · Open a session</h1>
        <form className={styles.form} method="post" onSubmit={submit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="sessionName">
              Session name
            </label>
            <input
              id="sessionName"
              className={styles.input}
              type="text"
              autoComplete="off"
              maxLength={maximumSessionNameLength}
              value={sessionName}
              disabled={isSubmitting}
              onChange={changeSessionName}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="facilitatorPassphrase">
              Facilitator passphrase
            </label>
            <input
              id="facilitatorPassphrase"
              className={styles.input}
              type="password"
              autoComplete="off"
              value={passphrase}
              disabled={isSubmitting}
              onChange={changePassphrase}
            />
          </div>
          {errorMessage !== null && (
            <p className={styles.error} role="alert">
              {errorMessage}
            </p>
          )}
          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.submit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Opening…" : "Open session"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
