const jest = require("jest");
const { select, selectAll, selectById } = require("../../dist/am.cjs.js");

describe("select tests", () => {
  it("exists", () => {
    expect(select).toBeDefined();
  });
});
