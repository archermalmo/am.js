/**
 * @module dataManipulation
 */

type alphanumeric = string | number;
type arrayLike = string | alphanumeric[];

/**
 * @function searchPropPath
 * @description Recursively searchs through a data object; throws an error if the resulting value of a searched path is undefined.
 * @param {alphanumeric[]} path Array of keys in the order of which will be used to recursively search an object
 * @param {object} collection Data object
 * @param {string} [delimiter] Delimiter by which to split the path; defaults to '.'
 * @return {any} Value at the end of the searched property path;
 */
const searchPropPath = (
  path: arrayLike,
  collection: object,
  delimiter: string = "."
): any => {
  const safePath = typeof path === "string" ? path.split(delimiter) : path;
  let pathResult = collection;
  safePath.forEach(key => {
    pathResult = pathResult[key];
  });
  if (pathResult) return pathResult;
  throw new Error(
    `pathResult yields undefined value when searching ${safePath.join(
      delimiter
    )} on collection argument.`
  );
};

export { searchPropPath };
