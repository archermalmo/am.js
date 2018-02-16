/**
 * @name select
 * @description Selects a DOM node based on a query
 * @param {string} query query selector to use to query an node
 * @returns {Element}
 */
const select: Function = (query: string): Element =>
  document.querySelector(query);

/**
 * @name selectAll
 * @description Selects a DOM nodelist based on a query, returns as an array
 * @param {string} query query selector to use to query a nodelist
 * @returns {array}
 */
const selectAll: Function = (query: string): Element[] => [
  ...document.querySelectorAll(query)
];

/**
 * @name selectById
 * @description Selects a DOM node based on an ID string
 * @param {string} id ID of DOM node to select
 * @returns {Element}
 */
const selectById: Function = (id: string): Element =>
  document.getElementById(id);

export { select, selectAll, selectById };
