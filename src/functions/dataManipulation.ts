/**
 * @module dataManipulation
 */

type alphanumeric = string | number;

/**
 * @function searchPropPath
 * @description Recursively searchs through a data object
 * @param {alphanumeric[]} [path] Array of keys in the order of which will be used to recursively search an object
 * @param {object} [collection] Data object
 * @return {any} Value at the end of the searched property path;
 */
const searchPropPath = (path: alphanumeric[], collection: object): any => {
  let pathResult = collection;
  path.forEach(key => {
    pathResult = pathResult[key];
  });
  return pathResult ? pathResult : false;
};

export { searchPropPath };
