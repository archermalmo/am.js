const jest = require("jest");
const { searchPropPath } = require("../../src/");

const testObject = {
	title: "Hello World",
	author: { name: { first: "john", last: "doe" }, github: "johndoe2018" },
	publish: new Date(Date.now())
};

describe("searchPropPath tests", () => {
	it("exists", () => {
		expect(searchPropPath).toBeDefined();
	});
	it("Searches through one level of props", () => {
		const result = searchPropPath(["title"], testObject);
		expect(result).toMatch("Hello World");
	});
	it("Searches through multiple levels of props", () => {
		const result = searchPropPath(["author", "name"], testObject);
		expect(result).toMatchObject(testObject.author.name);
	});
	it("Throws error when no value is defined on searched path", () => {
		const result = () => searchPropPath(["publishDate"], testObject);
		expect(result).toThrowError(
			"pathResult yields undefined value when searching publishDate on collection argument"
		);
	});
	it("Searches through a string path argument", () => {
		const result = searchPropPath("author.github", testObject);
		expect(result).toBe(testObject.author.github);
	});
	it("Searches through a string path argument with a custom delimiter", () => {
		const result = searchPropPath("author~name~first", testObject, "~");
		expect(result).toMatch(testObject.author.name.first);
	});
	it("Searches an object nested in an array", () => {
		const result = searchPropPath("0.username", [{ username: "johndoe2018" }]);
		expect(result).toMatch('johndoe2018');
	});
});
