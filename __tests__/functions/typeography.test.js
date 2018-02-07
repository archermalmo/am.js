const jest = require("jest");
const { capitalize, slugify, trim, ucFirst } = require("../../dist/am.cjs.js");

describe("capitalize tests", () => {
  it("exists", () => {
    expect(capitalize).toBeDefined();
  });
});
