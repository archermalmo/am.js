/**
 * Gets URL parameters.
 * From https://gist.github.com/geoffdavis92/1da7d0745e3bba036f94
 * @return {Object} Object of key/value pairs from parameters.
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
