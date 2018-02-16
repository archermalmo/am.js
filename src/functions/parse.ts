/**
 * Base from https://gist.github.com/geoffdavis92/1da7d0745e3bba036f94
 * @name params
 * @description Creates object of key/value pairs from URL parameters.
 * @param {string} url URL to parse; defaults to `window.location.search`
 * @return {object} Object of key/value pairs.
 */
const params = (url: string = window.location.search): object =>
  url
    .split("?")[1]
    .split("&")
    .map(q => q.split("="))
    .reduce((acc, [key, val], i, arr) => {
      acc[key] = decodeURIComponent(val).replace(/\+/g, " ");
      return acc;
    }, {});

/**
 * @name parseExternalMarkdownLinks
 * @description Transforms Markdown links to use target="_blank", rel="noopener noreferrer";
 * usually used when implementing clientside Markdown, before sending the Markdown to the main
 * parsing function.
 * @param {string} string String to parse as Markdown link
 * @var {RegExp} pattern Pattern to test for Markdown-formatted links
 * @returns {string}
 */
const parseExternalMarkdownLinks = (string: string): string => {
  const pattern: RegExp = /\[([^\]]+)\]\(([^)]+)\)/g;
  if (string.search(pattern) > -1) {
    return string.replace(
      pattern,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
  } else {
    return string;
  }
};

export { params as parseURLParams, parseExternalMarkdownLinks };
