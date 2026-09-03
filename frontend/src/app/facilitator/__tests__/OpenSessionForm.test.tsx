import { fireEvent, render, screen } from "@testing-library/react";
import { MessageKey } from "../../../domain/i18n/messages";
import type { FacilitatorSessionCreationPort } from "../../../domain/ports/facilitator/sessionCreationPort";
import { maximumSessionNameLength } from "../../../domain/sessionCreation";
import { languageWrapper } from "../../../testing/languageWrapper";
import { OpenSessionForm } from "../OpenSessionForm";
import {
  useOpenSessionForm,
  type OpenSessionFormResult,
} from "../useOpenSessionForm";

jest.mock("../useOpenSessionForm", () => ({
  useOpenSessionForm: jest.fn(),
}));

const form = useOpenSessionForm as jest.MockedFunction<
  typeof useOpenSessionForm
>;

const sessionCreation = {} as FacilitatorSessionCreationPort;

function formShowing(state: Partial<OpenSessionFormResult>) {
  const result: OpenSessionFormResult = {
    sessionName: "",
    passphrase: "",
    error: null,
    isSubmitting: false,
    changeSessionName: jest.fn(),
    changePassphrase: jest.fn(),
    submit: jest.fn(),
    ...state,
  };
  form.mockReturnValue(result);

  return result;
}

function sessionNameInput(): HTMLInputElement {
  return screen.getByLabelText("Session name");
}

function passphraseInput(): HTMLInputElement {
  return screen.getByLabelText("Facilitator passphrase");
}

describe("open session form", () => {
  it("shows what the hook holds", () => {
    formShowing({ sessionName: "Herbst 2024", passphrase: "secret" });

    render(<OpenSessionForm sessionCreation={sessionCreation} />, {
      wrapper: languageWrapper(),
    });

    screen.getByRole("heading", { name: "Values Workshop · Open a session" });
    expect(sessionNameInput()).toHaveValue("Herbst 2024");
    expect(passphraseInput()).toHaveValue("secret");
  });

  it("masks the passphrase", () => {
    formShowing({});

    render(<OpenSessionForm sessionCreation={sessionCreation} />, {
      wrapper: languageWrapper(),
    });

    expect(passphraseInput()).toHaveAttribute("type", "password");
  });

  it("keeps the passphrase out of any native form submission", () => {
    formShowing({});

    render(<OpenSessionForm sessionCreation={sessionCreation} />, {
      wrapper: languageWrapper(),
    });

    expect(passphraseInput()).not.toHaveAttribute("name");
    expect(sessionNameInput()).not.toHaveAttribute("name");
  });

  it("caps the session name at the length the backend accepts", () => {
    formShowing({});

    render(<OpenSessionForm sessionCreation={sessionCreation} />, {
      wrapper: languageWrapper(),
    });

    expect(sessionNameInput()).toHaveAttribute(
      "maxlength",
      String(maximumSessionNameLength),
    );
  });

  it("reports typing back to the hook", () => {
    const { changeSessionName, changePassphrase } = formShowing({});

    render(<OpenSessionForm sessionCreation={sessionCreation} />, {
      wrapper: languageWrapper(),
    });
    fireEvent.change(sessionNameInput(), { target: { value: "Herbst" } });
    fireEvent.change(passphraseInput(), { target: { value: "secret" } });

    expect(changeSessionName).toHaveBeenCalled();
    expect(changePassphrase).toHaveBeenCalled();
  });

  it("asks the hook to open the session when submitted", () => {
    const { submit } = formShowing({});

    const { container } = render(
      <OpenSessionForm sessionCreation={sessionCreation} />,
      { wrapper: languageWrapper() },
    );
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    expect(submit).toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Open session" }),
    ).toHaveAttribute("type", "submit");
  });

  it("locks the form while the session is being opened", () => {
    formShowing({ isSubmitting: true });

    render(<OpenSessionForm sessionCreation={sessionCreation} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByRole("button", { name: "Opening…" })).toBeDisabled();
    expect(sessionNameInput()).toBeDisabled();
    expect(passphraseInput()).toBeDisabled();
  });

  it("announces the error the hook reports", () => {
    formShowing({
      error: { key: MessageKey.OpenSessionPassphraseRejected },
    });

    render(<OpenSessionForm sessionCreation={sessionCreation} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "That facilitator passphrase was not accepted.",
    );
  });

  it("translates error params at render time", () => {
    formShowing({
      error: {
        key: MessageKey.OpenSessionNameRejected,
        params: { limit: maximumSessionNameLength },
      },
    });

    render(<OpenSessionForm sessionCreation={sessionCreation} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      `That session name was not accepted. Use up to ${maximumSessionNameLength} characters.`,
    );
  });
});
