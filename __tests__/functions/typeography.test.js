const jest = require("jest");
const mock = require("jest-mock");
const { capitalize, slugify, trim, ucFirst } = require("../../dist/am.cjs.js");

describe("capitalize()", () => {
	const mockedCapitalize = mock.fn(capitalize);
	it("exists", () => {
		expect(mockedCapitalize).toBeDefined();
	});
});
