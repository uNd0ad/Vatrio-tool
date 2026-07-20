import test from 'node:test';
import assert from 'node:assert/strict';

test('createDebouncedSave delays function call until interval passes', async () => {
  let calledCount = 0;
  let timer: any = null;

  const triggerSave = (delayMs: number, callback: () => void) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(callback, delayMs);
  };

  triggerSave(50, () => { calledCount++; });
  triggerSave(50, () => { calledCount++; });

  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(calledCount, 1);
});
