import { ListingStatus } from '../types';

export interface UndoableAction {
  id: string;
  type: 'status' | 'delete';
  listingId: string;
  previousStatus?: ListingStatus;
  timestamp: number;
}

const MAX_UNDO_STACK_SIZE = 20;
const stack: UndoableAction[] = [];

export function pushUndoAction(
  action: Omit<UndoableAction, 'id' | 'timestamp'>
): UndoableAction {
  const item: UndoableAction = {
    ...action,
    id: `undo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
  };

  stack.push(item);
  if (stack.length > MAX_UNDO_STACK_SIZE) {
    stack.shift();
  }
  return item;
}

export function popUndoAction(): UndoableAction | undefined {
  return stack.pop();
}

export function peekUndoAction(): UndoableAction | undefined {
  return stack[stack.length - 1];
}

export function clearUndoStack(): void {
  stack.length = 0;
}

export function getUndoStackSize(): number {
  return stack.length;
}
