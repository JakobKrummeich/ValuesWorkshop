"use client";

import { MessageKey } from "../../domain/i18n/messages";
import type { FacilitatorSessionCreationPort } from "../../domain/ports/facilitator/sessionCreationPort";
import { maximumSessionNameLength } from "../../domain/sessionCreation";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { useTranslation } from "../i18n/useTranslation";
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
  const { translate } = useTranslation();

  return (
    <div className={styles.screen}>
      <section className={styles.card}>
        <LanguageSwitcher />
        <h1 className={styles.title}>
          {translate(MessageKey.OpenSessionTitle)}
        </h1>
        <form className={styles.form} method="post" onSubmit={submit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="sessionName">
              {translate(MessageKey.OpenSessionName)}
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
              {translate(MessageKey.OpenSessionPassphrase)}
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
              {translate(
                isSubmitting
                  ? MessageKey.OpenSessionSubmitting
                  : MessageKey.OpenSessionSubmit,
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
