import { renderToString } from "react-dom/server";
import ParticipantLayout from "./layout";
import ParticipantHome from "./page";

describe("participant screen group", () => {
  it("receives its gateway through its own dependency context", () => {
    const html = renderToString(
      <ParticipantLayout>
        <ParticipantHome />
      </ParticipantLayout>,
    );

    expect(html).toContain("stub-session");
  });
});
