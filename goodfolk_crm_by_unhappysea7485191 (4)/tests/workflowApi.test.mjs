import test from 'node:test';
import assert from 'node:assert/strict';
import { postWorkflowJson, resolveWorkflowDrafts } from '../src/utils/workflowApi.js';

test('retries transient server errors and returns the successful response', async () => {
  let calls = 0;
  const response = await postWorkflowJson('/copy', { count: 10 }, {
    fetchImpl: async () => {
      calls += 1;
      return calls < 3 ? new Response('{}', { status: 503 }) : new Response('{"posts":[]}', { status: 200 });
    },
  });

  assert.equal(response.status, 200);
  assert.equal(calls, 3);
});

test('does not retry client errors', async () => {
  let calls = 0;
  const response = await postWorkflowJson('/copy', {}, {
    fetchImpl: async () => {
      calls += 1;
      return new Response('{"error":"bad request"}', { status: 400 });
    },
  });

  assert.equal(response.status, 400);
  assert.equal(calls, 1);
});

test('does not replay a server invocation that exceeded its execution limit', async () => {
  let calls = 0;
  const response = await postWorkflowJson('/copy', {}, {
    fetchImpl: async () => {
      calls += 1;
      return Response.json({ error: 'Function error', message: 'server.js did not respond within 30000ms' }, { status: 502 });
    },
  });

  assert.equal(response.status, 502);
  assert.equal(calls, 1);
});

test('surfaces network errors after bounded retries', async () => {
  let calls = 0;
  await assert.rejects(
    postWorkflowJson('/copy', {}, {
      attempts: 2,
      fetchImpl: async () => {
        calls += 1;
        throw new Error('offline');
      },
    }),
    /offline/,
  );
  assert.equal(calls, 2);
});

test('preserves generated copy as owner-review drafts when the reviewer fails', () => {
  const source = [{ title: 'Draft', caption: 'Original copy' }];
  const result = resolveWorkflowDrafts(source, { ok: false, data: { error: 'review unavailable' } }, 1);

  assert.equal(result.reviewed, false);
  assert.deepEqual(result.drafts, source);
});

test('uses reviewed copy when the reviewer returns a complete batch', () => {
  const source = [{ title: 'Draft', caption: 'Original copy' }];
  const result = resolveWorkflowDrafts(source, { ok: true, data: { posts: [{ title: 'Reviewed' }] } }, 1);

  assert.equal(result.reviewed, true);
  assert.deepEqual(result.drafts, [{ title: 'Reviewed', caption: 'Original copy' }]);
});

test('rejects reviewer output that did not pass the originality gate', () => {
  const source = [{ title: 'Unique draft', caption: 'New original copy' }];
  const result = resolveWorkflowDrafts(source, { ok: true, data: { reviewed: false, posts: [{ title: 'Repeated draft', caption: 'Duplicate copy' }] } }, 1);

  assert.equal(result.reviewed, false);
  assert.deepEqual(result.drafts, source);
});
