# Task 26 — i18n completeness

Audit result: parity is already machine-enforced — `Message =
Record<Language, string>` and `messages: Record<MessageKey, Message>` make
tsc (FE build gate) fail on any missing key or missing language;
`translate.test.ts` guards non-empty texts, catalog mirror, duplicates, and
cross-language parameter parity;
backend config loaders refuse blank locales at startup. Wire content flows
through `translate()`/`localizedText()` everywhere; rejections travel as
codes. What is actually missing:

## Decisions

- **D1 — presenter language switcher.** The wall has no way to pick its
  language (cookie/Accept-Language only). Add the existing
  `LanguageSwitcher` to the presenter entry page, as on the participant and
  facilitator pages.
- **D2 — localized PDF filename.** `workshop-record.pdf` becomes a message
  key: de `werte-workshop-protokoll.pdf`, en `values-workshop-record.pdf`;
  e2e filename assertions updated (scale spec asserts the en name;
  restart-recovery keeps its cheap download check).
- **D3 — shipped-config bilingual tests.** Quiz has
  `Every_shipped_text_is_present_in_both_locales`; add the same positive
  test over the shipped `config/values.json` and `config/animals.json`
  (skip if a differently-named equivalent already exists).
- **D4 — locale-flip e2e.** One small spec: on participant, facilitator,
  and presenter pages flip de→en via the switcher and assert a known label
  changes and `<html lang>` follows; proves the flip end-to-end and pins
  D1.
- **D5 — CI guard acceptance.** No new CI job: the key-parity gate is the
  FE build (tsc) + `translate.test.ts` in `ci-test.sh`; recorded in
  `tasks/todo.md` as the verification note.

## Slices

1. D1 + D4 (switcher + e2e), 2. D2 (filename + e2e), 3. D3 (BE tests).

## Verification

`./scripts/ci-lint.sh` + `./scripts/ci-test.sh` green; manual flip covered
by the D4 spec.
