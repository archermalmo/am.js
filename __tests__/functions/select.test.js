const jest = require("jest");
const mock = require("jest-mock");
const { select, selectAll, selectById } = require("../../src/");

const mockHTML = `<section>
<article>
  <header><h1 data-title="Example HTML">Example HTML</h1></header>
  <main id="article-body">
    <p class="first">Ex pariatur officia cillum esse mollit. Laboris sunt pariatur adipisicing fugiat. Adipisicing id pariatur laborum sint nisi veniam proident ullamco eu ullamco ea ad irure.</p>
    <p>Velit tempor minim non ea magna tempor ullamco esse. Occaecat excepteur dolor consectetur ipsum. Exercitation non reprehenderit aute incididunt duis sint labore voluptate exercitation laboris sit nulla sint cillum. Eiusmod veniam dolor culpa nisi do quis cillum qui laborum labore sit.</p>
  </main>
</article>
</section>`;

document.body.innerHTML = mockHTML;

describe("select()", () => {
	const mockedSelect = mock.fn(select);

	it("exists", () => {
		expect(select).toBeDefined();
	});

	it("selects a DOM node using a tagname", () => {
		const section = mockedSelect("section");

		expect(typeof section).toBe("object");
		expect(typeof section.innerHTML).toBe("string");
		expect(section.tagName).toBe("SECTION");
	});

	it("selects a DOM node using an id", () => {
		const articleBody = mockedSelect("#article-body");

		expect(articleBody.id).toBe("article-body");
		expect(articleBody.children).toHaveLength(2);
	});

	it("selects a DOM node using a class", () => {
		const firstP = mockedSelect(".first");

		expect(firstP.classList).toHaveLength(1);
		expect(firstP.classList).toContain("first");
		expect(firstP.innerHTML).toBe(
			"Ex pariatur officia cillum esse mollit. Laboris sunt pariatur adipisicing fugiat. Adipisicing id pariatur laborum sint nisi veniam proident ullamco eu ullamco ea ad irure."
		);
	});

	it("selects a DOM node using a data-attribute", () => {
		const h1 = mockedSelect("[data-title]");

		expect(h1.innerHTML).toBe("Example HTML");
		expect(Object.keys(h1.dataset)).toContain("title");
		expect(h1.dataset.title).toBe("Example HTML");
	});
});

describe("selectAll()", () => {
	const mockedSelectAll = mock.fn(selectAll);

	it("exists", () => {
		expect(mockedSelectAll).toBeDefined();
	});

	it("selects a list of DOM nodes using tagnames", () => {
		const paragraphs = mockedSelectAll("p");

		expect(paragraphs).toHaveLength(2);
		expect(paragraphs[0].classList).toContain("first");
	});

	it("selects a list of one DOM node", () => {
		const article = mockedSelectAll("article");

		expect(article).toHaveLength(1);
	});

	it("should have Array-like iterability", () => {
		const paragraphs = mockedSelectAll("p");

		expect(paragraphs.map(p => p)).toHaveLength(2);
		paragraphs.forEach(p => {
			expect(p).toBeDefined();
			expect(typeof p).toBe("object");
		});
		expect(paragraphs.filter(p => p.classList.length > 0)).toHaveLength(1);
	});
});

describe("selectById", () => {
	const mockedSelectById = mock.fn(selectById);

	it("exists", () => {
		expect(mockedSelectById).toBeDefined();
	});

	it("selects a DOM node using an id", () => {
		const articleBody = mockedSelectById("article-body");

		expect(articleBody).toBeDefined();
		expect(articleBody.id).toBe("article-body");
		expect(articleBody.children).toHaveLength(2);
	});
});
