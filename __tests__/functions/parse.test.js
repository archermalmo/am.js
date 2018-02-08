const jest = require("jest");
const {
	parseURLParams,
	parseMarkdownLinks
} = require("../../src/functions/parse"); //require("../../dist/am.cjs.js");

describe("parseURLParams tests", () => {
	it("exists", () => {
		expect(parseURLParams).toBeDefined();
	});
	it("parses a passed URL", () => {
		const url = "https://example.com/test?foo=bar&num=42";
		const params = parseURLParams(url);

		expect(Object.keys(params)).toMatchObject(["foo", "num"]);
		expect(Object.values(params)).toMatchObject(["bar", "42"]);
		expect(params.foo).toBe("bar");
		expect(params.num).toBe("42");
	});
	it("parses an implicit URL (window.location.search)", () => {
		/**
		 * note: window.location.search cannot be used or mocked in Jest?
		 * investigate: https://github.com/facebook/jest/issues/890
		 */
		expect(parseURLParams).toThrowError();
	});
});

describe("parseMarkdownLinks tests", () => {
	it("exists", () => {
		expect(parseMarkdownLinks).toBeDefined();
	});
	it("parses a Markdown-formatted link string", () => {
		const mdLink = "[test markdown link](https://example.com)";
		const parsedLink = parseMarkdownLinks(mdLink);

		expect(typeof mdLink).toBe("string");
		expect(typeof parsedLink).toBe("string");
		expect(parsedLink).toMatch(
			`<a href="https://example.com" target="_blank" rel="noopener noreferrer">test markdown link</a>`
		);
	});
	it("fails to match bad Markdown string", () => {
		const mdText = "normal text";
		const mdReference = "[reference link][1]";
		const mdAsset = "![alt text](https://example.com/image.jpg)";

		expect(parseMarkdownLinks(mdText)).toMatch(mdText);
		expect(parseMarkdownLinks(mdReference)).toMatch(mdReference);
		expect(parseMarkdownLinks(mdAsset)).toMatch(mdAsset);
	});
});
