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

/**
 * @name isElementInViewport
 * @description Determines if a given element is partially or
 * fully visible in the viewport.
 * @param {object} config Config object
 * @return {boolean}
 */
function isElementInViewport({
  element,
  elementDivisorSize,
  useBottomOffset
}: {
  element: Element;
  elementDivisorSize: number;
  useBottomOffset: boolean;
}): boolean {
  const defaultParams: {
    elementDivisorSize: number;
    useBottomOffset: boolean;
  } = { elementDivisorSize: 1, useBottomOffset: false };

  const safeArgs = {
    ...defaultParams,
    ...{
      element,
      elementDivisorSize: Math.ceil(Math.abs(elementDivisorSize)),
      useBottomOffset
    }
  };

  const { top, bottom, height } = element.getBoundingClientRect();

  const triggerTop =
    (window.innerHeight || document.documentElement.clientHeight) -
    height / elementDivisorSize;
  const triggerBottom = useBottomOffset ? height / elementDivisorSize : 0;

  return bottom >= triggerBottom && top <= triggerTop;
}

export { isElementInViewport, scrollTo };
