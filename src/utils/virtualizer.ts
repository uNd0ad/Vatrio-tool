export interface VirtualizerOptions {
  totalItems: number;
  itemHeight: number;
  scrollTop: number;
  containerHeight: number;
  overscan?: number;
}

export interface VirtualSlice {
  startIndex: number;
  endIndex: number;
  topPadding: number;
  bottomPadding: number;
}

/**
 * Calculates the visible index range and spacer paddings for virtualized rendering
 * of large lists/tables without rendering off-screen elements into the DOM.
 */
export function getVirtualSlice({
  totalItems,
  itemHeight,
  scrollTop,
  containerHeight,
  overscan = 5,
}: VirtualizerOptions): VirtualSlice {
  if (totalItems <= 0 || itemHeight <= 0) {
    return { startIndex: 0, endIndex: 0, topPadding: 0, bottomPadding: 0 };
  }

  const safeScrollTop = Math.max(0, scrollTop);
  const safeContainerHeight = Math.max(0, containerHeight);

  const rawStart = Math.floor(safeScrollTop / itemHeight);
  const visibleCount = Math.ceil(safeContainerHeight / itemHeight);

  const startIndex = Math.max(0, rawStart - overscan);
  const endIndex = Math.min(totalItems, rawStart + visibleCount + overscan);

  const topPadding = startIndex * itemHeight;
  const bottomPadding = (totalItems - endIndex) * itemHeight;

  return {
    startIndex,
    endIndex,
    topPadding,
    bottomPadding,
  };
}
