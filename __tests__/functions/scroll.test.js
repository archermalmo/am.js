const jest = require("jest");
const mock = require("jest-mock");
const { isElementInViewport, scrollTo } = require("../../src/");

const mockHTML = `<section>
<article>
  <header><h1>Example HTML</h1></header>
  <main id="article-body">
    <p>Ex pariatur officia cillum esse mollit. Laboris sunt pariatur adipisicing fugiat. Adipisicing id pariatur laborum sint nisi veniam proident ullamco eu ullamco ea ad irure.</p>
    <p>Velit tempor minim non ea magna tempor ullamco esse. Occaecat excepteur dolor consectetur ipsum. Exercitation non reprehenderit aute incididunt duis sint labore voluptate exercitation laboris sit nulla sint cillum. Eiusmod veniam dolor culpa nisi do quis cillum qui laborum labore sit.</p>
  </main>
</article>
</section>`;

document.body.innerHTML = mockHTML;
document.body.clientHeight = 800;

describe("isElementInViewport tests", () => {
	const mockedFn = mock.fn(isElementInViewport);
	const element = document.getElementById("article-body");

	it("exists", () => {
		expect(mockedFn).toBeDefined();
	});

	it("missing optional argument does not throw error", () => {
		const mockedResult = mockedFn({
			element
		});
		expect(mockedFn).toBeCalled();
		expect(typeof mockedResult).toBe('boolean');
	});

	it("valid arguments do not throw error", () => {
		const mockedResult = mockedFn({
			element,
			threshold: 0.5
		});
		expect(mockedFn).toBeCalled();
		expect(typeof mockedResult).toBe('boolean');
	});

	it("negative threshold throws RangeError", () => {
		function callFunction() {
			mockedFn({
				element,
				threshold: -1
			});
		}
		expect(callFunction).toThrow(RangeError);
	});

	it("threshold > 1 throws RangeError", () => {
		function callFunction() {
			mockedFn({
				element,
				threshold: 2
			});
		}
		expect(callFunction).toThrow(RangeError);
	});
});

describe("scrollTo tests", () => {
	const element = document.getElementById("article-body");
	const mockedFn = mock.fn(scrollTo);

	it("exists", () => {
		expect(mockedFn).toBeDefined();
	});

	it("scrolls to a set point on the DOM", () => {
		mockedFn({ element, to: 0, duration: 1000 });
		mockedFn({ element, to: 0, duration: 0 });
		mockedFn({ element, to: 250, duration: 500 });
		expect(mockedFn).toHaveBeenCalledTimes(3);
	});
});
