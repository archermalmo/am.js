const jest = require("jest");
const { isElementInViewport, scrollTo } = require("../../dist/am.cjs.js");

describe("isElementInViewport tests", () => {
  it("exists", () => {
    expect(isElementInViewport).toBeDefined();
  });
});
