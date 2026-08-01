import { fireEvent, render, screen } from "@testing-library/react";
import type { FacilitatorSessionCreationPort } from "../../../domain/ports/facilitator/sessionCreationPort";
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
    errorMessage: null,
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

    render(<OpenSessionForm sessionCreation={sessionCreation} />);

    screen.getByRole("heading", { name: "ValuesWorkshop · Open a session" });
    expect(sessionNameInput()).toHaveValue("Herbst 2024");
    expect(passphraseInput()).toHaveValue("secret");
  });

  it("masks the passphrase", () => {
    formShowing({});

    render(<OpenSessionForm sessionCreation={sessionCreation} />);

    expect(passphraseInput()).toHaveAttribute("type", "password");
  });

  it("never submits the passphrase through a GET url", () => {
    formShowing({});

    const { container } = render(
      <OpenSessionForm sessionCreation={sessionCreation} />,
    );

    expect(container.querySelector("form")).toHaveAttribute("method", "post");
  });

  it("reports typing back to the hook", () => {
    const { changeSessionName, changePassphrase } = formShowing({});

    render(<OpenSessionForm sessionCreation={sessionCreation} />);
    fireEvent.change(sessionNameInput(), { target: { value: "Herbst" } });
    fireEvent.change(passphraseInput(), { target: { value: "secret" } });

    expect(changeSessionName).toHaveBeenCalled();
    expect(changePassphrase).toHaveBeenCalled();
  });

  it("asks the hook to open the session when submitted", () => {
    const { submit } = formShowing({});

    render(<OpenSessionForm sessionCreation={sessionCreation} />);
    fireEvent.click(screen.getByRole("button", { name: "Open session" }));

    expect(submit).toHaveBeenCalled();
  });

  it("locks the form while the session is being opened", () => {
    formShowing({ isSubmitting: true });

    render(<OpenSessionForm sessionCreation={sessionCreation} />);

    expect(screen.getByRole("button", { name: "Opening…" })).toBeDisabled();
    expect(sessionNameInput()).toBeDisabled();
    expect(passphraseInput()).toBeDisabled();
  });

  it("announces the error the hook reports", () => {
    formShowing({
      errorMessage: "That facilitator passphrase was not accepted.",
    });

    render(<OpenSessionForm sessionCreation={sessionCreation} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "That facilitator passphrase was not accepted.",
    );
  });
});
