/**
 * @module scroll
 */

/**
 * @function isElementInViewport
 * @description Determines if a given element is partially or
 * fully visible in the viewport.
 * @param {object} config
 * @param {Element} config.element HTML Element node to target.
 * @param {number} [config.threshold] Ratio of the viewport height the element
 * must fill before being considered visible. E.g. 0.5 means the element
 * must take up 50% of the screen before returning true. Defaults to 0.25.
 * Only used for elements taller than the viewport.
 * @return {boolean} Boolean describing if input is fully/partially
 * in the viewport, relative to the threshold setting.
 */
function isElementInViewport({
  element: argElement,
  threshold: argThreshold
}: {
  element: Element;
  threshold: number;
}): boolean {
  const defaultParams: {
    threshold: number;
  } = {
    threshold: 0.25
  };

  const safeArgs = {
    threshold: argThreshold || defaultParams.threshold
  };

  const rect: ClientRect | DOMRect = argElement.getBoundingClientRect();

  const viewportHeight: number = Math.max(
    document.documentElement.clientHeight,
    window.innerHeight || 0
  );
  const { threshold } = safeArgs;

  if (threshold < 0 || threshold > 1) {
    throw new RangeError(
      "Threshold argument must be a decimal between 0 and 1"
    );
  }

  //If the element is too tall to fit within the viewport
  if (rect.height >= threshold * viewportHeight) {
    if (
      rect.top - viewportHeight <= threshold * viewportHeight * -1 &&
      rect.bottom >= threshold * viewportHeight
    ) {
      return true;
    } else {
      return false;
    }
  } else {
    //If the element is short enough to fit within the viewport
    if (rect.top >= 0 && rect.bottom - viewportHeight <= 0) {
      return true;
    } else {
      return false;
    }
  }
}

/**
 * From http://bit.ly/2cP65fD
 * @todo Classify and describe params.
 * @function scrollTo
 * @description Scrolls given element to determined point.
 * @param  {Element} element  [description]
 * @param  {number} to       [description]
 * @param  {number} duration [description]
 * @return {void}
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
