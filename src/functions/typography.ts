/**
 * @module typography
 */

/**
 * @function capitalize
 * @description Capitalizes all words in a string.
 * @param {string} string Text to capitalize.
 * @returns {string} Title-cased text.
 */
const capitalize = (string: string): string =>
  string
    .split(" ")
    .map(s => ucFirst(s))
    .join(" ");

/**
 * @function slugify
 * @description Lowercases string, replaces spaces and special characters
 * with a set delimiter.
 * @param {string} textToSlug Text to slugify.
 * @param {string} [delimiter] Delimiter; defaults to "-".
 * @returns {string} Slugified text.
 */
const slugify = (textToSlug: string, delimiter: string = "-"): string =>
  textToSlug
    .replace(/(\!|#|\$|%|\*|\.|\/|\\|\(|\)|\+|\||\,|\:|\'|\")/g, "")
    .replace(/(.)(\s|\_|\-)+(.)/g, `$1${delimiter}$3`)
    .toLowerCase();

/**
 * @function trim
 * @description Trims whitespace on either end of a string.
 * @param {string} string Text to trim.
 * @returns {string} Trimmed text.
 */
const trim = (string: string): string => string.replace(/^\s+|\s+$/g, "");

/**
 * @function ucFirst
 * @description Capitalizes first word in a string.
 * @param {string} string Text to capitalize.
 * @returns {string} Capitalized text.
 */
const ucFirst = ([firstLetter, ...restLetters]: string): string =>
  `${firstLetter.toUpperCase()}${restLetters.join("")}`;

export { capitalize, slugify, trim, ucFirst };
