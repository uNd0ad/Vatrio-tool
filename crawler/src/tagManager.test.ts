import test from 'node:test';
import assert from 'node:assert/strict';

function addTag(tags: string[], newTag: string): string[] {
  const trimmed = newTag.trim();
  if (!trimmed || tags.includes(trimmed)) return tags;
  return [...tags, trimmed];
}

function removeTag(tags: string[], targetTag: string): string[] {
  return tags.filter((t) => t !== targetTag);
}

test('addTag and removeTag manage listing custom tags correctly', () => {
  let tags: string[] = ['Urgent'];

  tags = addTag(tags, 'Investitie');
  assert.deepEqual(tags, ['Urgent', 'Investitie']);

  tags = addTag(tags, 'Urgent'); // Duplicate ignored
  assert.equal(tags.length, 2);

  tags = removeTag(tags, 'Urgent');
  assert.deepEqual(tags, ['Investitie']);
});
