const capitalize = (string: string): string =>
  string
    .split(" ")
    .map(s => ucFirst(s))
    .join(" ");

const slugify = (textToSlug: string, delimiter: string = "-"): string =>
  textToSlug
    .replace(/(\!|#|\$|%|\*|\.|\/|\\|\(|\)|\+|\||\,|\:|\'|\")/g, "")
    .replace(/(.)(\s|\_|\-)+(.)/g, `$1${delimiter}$3`)
    .toLowerCase();

const trim = (string: string): string => string.replace(/^\s+|\s+$/g, "");

const ucFirst = ([firstLetter, ...restLetters]: string): string =>
  `${firstLetter.toUpperCase()}${restLetters.join("")}`;

export { capitalize, slugify, trim, ucFirst };
