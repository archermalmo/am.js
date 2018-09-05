const jest = require("jest");
const { searchPropPath } = require("../../src/");

describe("searchPropPath tests", () => {
	it("exists", () => {
		expect(searchPropPath).toBeDefined();
	});
	// it("parses a passed URL", () => {
	// 	const url = "https://example.com/test?foo=bar&num=42";
	// 	const params = searchPropPath(url);

	// 	expect(Object.keys(params)).toMatchObject(["foo", "num"]);
	// 	expect(Object.values(params)).toMatchObject(["bar", "42"]);
	// 	expect(params.foo).toBe("bar");
	// 	expect(params.num).toBe("42");
	// });
});