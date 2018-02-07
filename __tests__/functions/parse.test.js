const jest = require("jest");
const { parseURLParams, parseMarkdownLinks } = require("../../dist/am.cjs.js");

describe("parseURLParams tests", () => {
  it("exists", () => {
    expect(parseURLParams).toBeDefined();
  });
});
// parseMarkdownLinks
