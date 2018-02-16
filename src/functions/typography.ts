/**
 * @module typography
 */

/**
 * @function capitalize
 * @param {string} string
 * @returns {string}
 */
const capitalize = (string: string): string =>
  string
    .split(" ")
    .map(s => ucFirst(s))
    .join(" ");

/**
 * @function slugify
 * @returns {string}
 */
const slugify = (textToSlug: string, delimiter: string = "-"): string =>
  textToSlug
    .replace(/(\!|#|\$|%|\*|\.|\/|\\|\(|\)|\+|\||\,|\:|\'|\")/g, "")
    .replace(/(.)(\s|\_|\-)+(.)/g, `$1${delimiter}$3`)
    .toLowerCase();

/**
 * @function trim
 * @param {string} string
 * @returns {string}
 */
const trim = (string: string): string => string.replace(/^\s+|\s+$/g, "");

/**
 * @function ucFirst
 * @param {string} string
 * @returns {string}
 */
const ucFirst = ([firstLetter, ...restLetters]: string): string =>
  `${firstLetter.toUpperCase()}${restLetters.join("")}`;

export { capitalize, slugify, trim, ucFirst };
