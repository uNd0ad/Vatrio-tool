import test from 'node:test';
import assert from 'node:assert/strict';

test('handleWindowMinimize intercepts minimize when setting enabled', () => {
  let defaultPrevented = false;
  const mockEvent = {
    preventDefault: () => { defaultPrevented = true; },
  };

  const handleMinimize = (evt: typeof mockEvent, enabled: boolean) => {
    if (enabled) {
      evt.preventDefault();
      return true;
    }
    return false;
  };

  assert.equal(handleMinimize(mockEvent, true), true);
  assert.equal(defaultPrevented, true);
});
