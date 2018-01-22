/**
 * From https://gist.github.com/geoffdavis92/1da7d0745e3bba036f94
 * @name params
 * @description Creates object of key/value pairs from URL parameters.
 * @return {Object} Object of key/value pairs.
 */
const params = (): object =>
  window.location.search
    .split("?")[1]
    .split("&")
    .map(q => q.split("="))
    .reduce((acc, [key, val], i, arr) => {
      acc[key] = decodeURIComponent(val).replace(/\+/g, " ");
      return acc;
    }, {});

/**
 * @name parseMarkdownLinks
 * @param {string} string String to parse as Markdown link
 * @returns {string}
 */
const parseMarkdownLinks = (string: string): string => {
  var pattern: RegExp = /\[([^\]]+)\]\(([^)]+)\)/g;
  if (string.search(pattern) > -1) {
    return string.replace(
      pattern,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
  } else {
    return string;
  }
};

export { params as parseURLParams, parseMarkdownLinks };
