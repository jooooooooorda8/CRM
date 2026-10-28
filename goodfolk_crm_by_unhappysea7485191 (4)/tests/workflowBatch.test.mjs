import test from 'node:test';
import assert from 'node:assert/strict';
import { getNextWorkflowBatch } from '../src/utils/workflowBatch.js';

test('workflow batch plan advances by ten toward the saved target', () => {
  assert.deepEqual(getNextWorkflowBatch(100, null), {
    target: 100, startAt: 0, batchEnd: 10, batchNumber: 1, batchSize: 10,
  });
  assert.deepEqual(getNextWorkflowBatch(100, { target: 100, generated: 20, status: 'complete' }), {
    target: 100, startAt: 20, batchEnd: 30, batchNumber: 3, batchSize: 10,
  });
});

test('workflow batch plan caps the last batch and starts a new sequence after reaching target', () => {
  assert.deepEqual(getNextWorkflowBatch(30, { target: 30, generated: 20, status: 'needs_attention' }), {
    target: 30, startAt: 20, batchEnd: 30, batchNumber: 3, batchSize: 10,
  });
  assert.deepEqual(getNextWorkflowBatch(30, { target: 30, generated: 30, status: 'complete' }), {
    target: 30, startAt: 0, batchEnd: 10, batchNumber: 1, batchSize: 10,
  });
});
