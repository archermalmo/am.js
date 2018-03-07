const jest = require("jest");
const { parseURLParams, parseExternalMarkdownLinks } = require("../../src/"); //require("../../dist/am.cjs.js");

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

describe("parseExternalMarkdownLinks tests", () => {
	it("exists", () => {
		expect(parseExternalMarkdownLinks).toBeDefined();
	});

	it("parses a Markdown-formatted link string", () => {
		const mdLink = "[test markdown link](https://example.com)";
		const mdContent = `# Some title\nThis is an [example link](https://example.com).\nThank you.`;
		const parsedLink = parseExternalMarkdownLinks(mdLink);
		const parsedContent = parseExternalMarkdownLinks(mdContent);

		expect(typeof mdLink).toBe("string");
		expect(typeof parsedLink).toBe("string");
		expect(parsedLink).toMatch(
			`<a href="https://example.com" target="_blank" rel="noopener noreferrer">test markdown link</a>`
		);
		expect(typeof mdContent).toBe("string");
		expect(typeof parsedContent).toBe("string");
		expect(parseExternalMarkdownLinks(mdContent)).toMatch(
			`# Some title\nThis is an <a href="https://example.com" target="_blank" rel="noopener noreferrer">example link</a>.\nThank you.`
		);
	});

	it("fails to match bad Markdown string", () => {
		const mdText = "normal text";
		const mdReference = "[reference link][1]";
		const mdAsset = "![alt text](https://example.com/image.jpg)";

		expect(parseExternalMarkdownLinks(mdText)).toMatch(mdText);
		expect(parseExternalMarkdownLinks(mdReference)).toMatch(mdReference);
		// TODO: update test/regex to test for mdAsset link style
	});
});
