import { renderToString } from "react-dom/server";
import PresenterLayout from "../layout";
import PresenterHome from "../page";

describe("presenter screen group", () => {
  it("receives its gateway through its own dependency context", () => {
    const html = renderToString(
      <PresenterLayout>
        <PresenterHome />
      </PresenterLayout>,
    );

    expect(html).toContain("stub-session");
  });
});
