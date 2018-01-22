const select: Function = (query: string): Element =>
  document.querySelector(query);

const selectAll: Function = (query: string): Element[] => {
  const elementArray = [];
  const allMatches = document.querySelectorAll(query);
  for (let i = 0; i < allMatches.length; i++) {
    elementArray.push(allMatches[i]);
  }
  return elementArray;
};

const selectById: Function = (id: string): Element =>
  document.getElementById(id);

export { select, selectAll, selectById };
