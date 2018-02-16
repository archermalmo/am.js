/**
 * @module select
 */

/**
 * @function select
 * @description Selects a DOM node based on a query
 * @param {string} query query selector to use to query an node
 * @returns {Element} First DOM node that matches the query
 */
const select: Function = (query: string): Element =>
  document.querySelector(query);

/**
 * @function selectAll
 * @description Selects a DOM nodelist based on a query
 * @param {string} query query selector to use to query a nodelist
 * @returns {Element[]} Array of DOM nodes that match the query
 */
const selectAll: Function = (query: string): Element[] => [
  ...document.querySelectorAll(query)
];

/**
 * @function selectById
 * @description Selects a DOM node based on an ID string
 * @param {string} id ID of DOM node to select
 * @returns {Element} DOM node with matched ID
 */
const selectById: Function = (id: string): Element =>
  document.getElementById(id);

export { select, selectAll, selectById };
