/**
 * @name isElementInViewport
 * @description Determines if a given element is partially or
 * fully visible in the viewport.
 * @param {object} config Config object.
 * @var {Element} element HTML Element node to target.
 * @var {number} elementDivisorSize Size of division of
 * element's height to offset. E.g. 2 is half the height, 3
 * is one-third the height, etc.
 * @var {boolean} useBottomOffset Determines if offset
 * generated from elementDivisorSize should be applied to
 * the bottom of the element.
 * @return {boolean}
 */
function isElementInViewport({
  element,
  elementDivisorSize: argElementDivisorSize,
  useBottomOffset: argUseBottomOffset
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
      elementDivisorSize: Math.ceil(
        Math.abs(argElementDivisorSize || defaultParams.elementDivisorSize)
      ),
      useBottomOffset: argUseBottomOffset || defaultParams.useBottomOffset
    }
  };

  const { elementDivisorSize, useBottomOffset } = safeArgs;

  const {
    top,
    bottom,
    height
  }: {
    top: number;
    bottom: number;
    height: number;
  } = element.getBoundingClientRect();

  const triggerTop: number =
    (window.innerHeight || document.documentElement.clientHeight) -
    height / elementDivisorSize;
  const triggerBottom: number = useBottomOffset
    ? height / elementDivisorSize
    : 0;

  return bottom >= triggerBottom && top <= triggerTop;
}

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

export { isElementInViewport, scrollTo };
