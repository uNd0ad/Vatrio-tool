import test from 'node:test';
import assert from 'node:assert/strict';

interface MockUndoItem {
  id: string;
  listingId: string;
  previousStatus: string;
}

class TestUndoStack {
  private stack: MockUndoItem[] = [];

  push(item: MockUndoItem) {
    this.stack.push(item);
  }

  pop(): MockUndoItem | undefined {
    return this.stack.pop();
  }

  size(): number {
    return this.stack.length;
  }
}

test('undo stack pushes and pops items correctly', () => {
  const stack = new TestUndoStack();
  stack.push({ id: '1', listingId: 'l1', previousStatus: 'new' });
  stack.push({ id: '2', listingId: 'l2', previousStatus: 'contacted' });

  assert.equal(stack.size(), 2);
  const popped = stack.pop();
  assert.equal(popped?.id, '2');
  assert.equal(stack.size(), 1);
});
