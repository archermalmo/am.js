const jest = require("jest");
const mock = require("jest-mock");
const { capitalize, slugify, trim, ucFirst } = require("../../dist/am.cjs.js");

const uncappedString = "the quick brown fox jumped over the lazy dog.";
const postTitleString = "The Quick Brown Fox!";
const paddedString = "  The quick brown fox      ";
const dashedString = "The quick Brown-Fox";

describe("capitalize()", () => {
	const mockedCapitalize = mock.fn(capitalize);
	it("exists", () => {
		expect(mockedCapitalize).toBeDefined();
	});
	it("should capitalize all words in a string", () => {
		expect(mockedCapitalize(uncappedString)).toMatch(
			"The Quick Brown Fox Jumped Over The Lazy Dog."
		);
	});
	it("should not transform a capitalized string", () => {
		expect(mockedCapitalize(postTitleString)).toMatch(postTitleString);
	});
});

describe("slugify()", () => {
	const mockedSlugify = mock.fn(slugify);
	it("exists", () => {
		expect(mockedSlugify).toBeDefined();
	});
	it("lowercases string, replaces spaces and special characters with dashes", () => {
		expect(mockedSlugify(postTitleString)).toMatch("the-quick-brown-fox");
	});
	it("replaces spaces and special characters with provided delimiter", () => {
		expect(mockedSlugify(postTitleString, "_")).toMatch("the_quick_brown_fox");
	});
	it("removes duplicate delimiters", () => {
		expect(mockedSlugify(dashedString)).toMatch("the-quick-brown-fox");
	});
});

describe("trim()", () => {
	const mockedTrim = mock.fn(trim);

	it("exists", () => {
		expect(mockedTrim).toBeDefined();
	});

	it("removes space-padding on left of string", () => {
		expect(mockedTrim(paddedString)).toMatch(/^The quick brown fox/);
	});

	it("removes space-padding on right of string", () => {
		expect(mockedTrim(paddedString)).toMatch(/The quick brown fox$/);
	});
});

describe("ucFirst", () => {
	const mockedUCFirst = mock.fn(ucFirst);

	it("exists", () => {
		expect(mockedUCFirst).toBeDefined();
	});

	it("Capitalizes the first word in a string", () => {
		expect(mockedUCFirst(uncappedString)).toMatch(
			"The quick brown fox jumped over the lazy dog."
		);
	});

	// TODO: add trim function to ucFirst to normalize, write test
});
