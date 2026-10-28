import test from 'node:test';
import assert from 'node:assert/strict';
import { photoEnglishText } from '../src/utils/photoText.js';

test('photo overlay text keeps the English side of bilingual copy', () => {
  assert.equal(photoEnglishText('Morning coffee / قهوة الصباح'), 'Morning coffee');
});

test('photo overlay text removes Arabic script from legacy copy', () => {
  assert.equal(photoEnglishText('Morning قهوة coffee'), 'Morning coffee');
  assert.equal(photoEnglishText('قهوة الصباح'), '');
});
