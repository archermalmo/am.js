/**
 * From http://bit.ly/2cP65fD
 * @name scrollTo
 * @description Scrolls given element to determined point.
 * @param  {Element} element  [description]
 * @param  {number} to       [description]
 * @param  {number} duration [description]
 * @return {void}          [description]
 */
function scrollTo(element: Element, to: number, duration: number): void {
  if (duration <= 0) return;
  const difference: number = to - element.scrollTop;
  const perTick: number = difference / duration * 10;

  setTimeout(function() {
    element.scrollTop = element.scrollTop + perTick;
    if (element.scrollTop === to) return;
    scrollTo(element, to, duration - 10);
  }, 10);
}

export { scrollTo };
