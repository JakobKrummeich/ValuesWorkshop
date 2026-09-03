"use client";

import { MessageKey } from "../domain/i18n/messages";
import { EntryNotice } from "./EntryNotice";
import { useTranslation } from "./i18n/useTranslation";

export function MissingSession() {
  const { translate } = useTranslation();

  return (
    <EntryNotice
      heading={translate(MessageKey.MissingSessionHeading)}
      body={translate(MessageKey.MissingSession)}
    />
  );
}
