"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import { useTranslation } from "../../../i18n/useTranslation";
import { ActionBar } from "../../ActionBar";
import { CallToAction, CallToActionVariant } from "../../CallToAction";

export function GroupWorkControls({
  isSubmitted,
  canSubmit,
  isSending,
  onSubmit,
  onReopen,
}: {
  isSubmitted: boolean;
  canSubmit: boolean;
  isSending: boolean;
  onSubmit: () => void;
  onReopen: () => void;
}) {
  const { translate } = useTranslation();

  if (isSubmitted) {
    return (
      <ActionBar>
        <CallToAction
          variant={CallToActionVariant.Ghost}
          testId="reopen-button"
          disabled={isSending}
          onClick={onReopen}
        >
          {translate(MessageKey.GroupWorkReopen)}
        </CallToAction>
      </ActionBar>
    );
  }

  return (
    <ActionBar
      hint={
        canSubmit || isSending
          ? undefined
          : translate(MessageKey.GroupWorkSubmitDisabledHint)
      }
      hintTestId="submit-disabled-hint"
    >
      <CallToAction
        testId="submit-group-work-button"
        disabled={!canSubmit || isSending}
        onClick={onSubmit}
      >
        {translate(MessageKey.GroupWorkSubmit)}
      </CallToAction>
    </ActionBar>
  );
}
