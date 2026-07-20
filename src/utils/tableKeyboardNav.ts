export function getNextFocusedRowIndex(
  currentIndex: number,
  totalRows: number,
  key: 'ArrowUp' | 'ArrowDown'
): number {
  if (totalRows <= 0) return -1;
  if (currentIndex < 0) return 0;

  if (key === 'ArrowDown') {
    return Math.min(totalRows - 1, currentIndex + 1);
  }
  if (key === 'ArrowUp') {
    return Math.max(0, currentIndex - 1);
  }
  return currentIndex;
}
