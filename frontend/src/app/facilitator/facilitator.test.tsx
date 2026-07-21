import { renderToString } from "react-dom/server";
import FacilitatorLayout from "./layout";
import FacilitatorHome from "./page";

describe("facilitator screen group", () => {
  it("receives its gateway through its own DI context", () => {
    const html = renderToString(
      <FacilitatorLayout>
        <FacilitatorHome />
      </FacilitatorLayout>,
    );

    expect(html).toContain("stub-session");
  });
});
