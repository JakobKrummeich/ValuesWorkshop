import { renderToString } from "react-dom/server";
import Home from "../page";

describe("home page", () => {
  it("renders the workshop title", () => {
    expect(renderToString(<Home />)).toContain("ValuesWorkshop");
  });
});
