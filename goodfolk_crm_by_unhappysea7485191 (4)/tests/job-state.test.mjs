import test from 'node:test';
import assert from 'node:assert/strict';
import server from '../server.js';

function createEnv(initialState) {
  let state = initialState;
  return {
    getState: () => state,
    DB: {
      prepare(sql) {
        return {
          bind(...values) {
            return {
              first: async () => sql.includes('SELECT state_json') ? { state_json: JSON.stringify(state) } : null,
              all: async () => ({ results: [] }),
              run: async () => {
                if (sql.includes('INSERT INTO crm_state')) state = JSON.parse(values[1]);
                return { meta: { changes: 1 } };
              },
            };
          },
        };
      },
    },
  };
}

function request(path, body) {
  return new Request('https://project.test' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-websim-user-id': 'owner', 'x-websim-project-owner-id': 'owner' },
    body: JSON.stringify(body),
  });
}

test('bot jobs persist validated states, results, ownership, and review independently', async () => {
  const env = createEnv({ businesses: [{ id: 'biz-1', name: 'Northstar' }], botTasks: [] });
  const created = await server.fetch(request('/api/crm/bot-task', {
    id: 'task-1', businessId: 'biz-1', botId: 'writer', title: 'Draft a campaign', instructions: 'Use verified facts.', status: 'running',
  }), env);
  assert.equal(created.status, 201);
  assert.equal((await created.json()).task.status, 'queued');
  assert.equal(env.getState().botTasks[0].ownerId, 'owner');

  const invalid = await server.fetch(request('/api/crm/bot-task-update', { id: 'task-1', status: 'running' }), env);
  assert.equal(invalid.status, 409);

  for (const status of ['preparing', 'running']) {
    const response = await server.fetch(request('/api/crm/bot-task-update', { id: 'task-1', status }), env);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).task.status, status);
  }

  const incomplete = await server.fetch(request('/api/crm/bot-task-update', { id: 'task-1', status: 'completed' }), env);
  assert.equal(incomplete.status, 400);

  const partial = await server.fetch(request('/api/crm/bot-task-update', {
    id: 'task-1', status: 'partially_completed', result: 'First draft', modelInfo: { provider: 'Test AI', model: 'test-model' },
  }), env);
  assert.equal(partial.status, 200);
  assert.equal((await partial.json()).task.status, 'partially_completed');

  const approved = await server.fetch(request('/api/crm/bot-task-update', {
    id: 'task-1', status: 'completed', reviewStatus: 'approved',
  }), env);
  const approvedTask = (await approved.json()).task;
  assert.equal(approvedTask.status, 'completed');
  assert.equal(approvedTask.reviewStatus, 'approved');
  assert.equal(approvedTask.modelInfo.model, 'test-model');

  const reopened = await server.fetch(request('/api/crm/bot-task-update', { id: 'task-1', status: 'queued' }), env);
  assert.equal(reopened.status, 200);
  assert.equal((await reopened.json()).task.result, '');
});

test('only queued jobs can be cancelled', async () => {
  const env = createEnv({ businesses: [{ id: 'biz-1', name: 'Northstar' }], botTasks: [{
    id: 'task-1', businessId: 'biz-1', botId: 'writer', title: 'Draft', instructions: 'Write', status: 'queued', progress: 0,
  }] });
  const cancelled = await server.fetch(request('/api/crm/bot-task-update', { id: 'task-1', status: 'cancelled' }), env);
  assert.equal(cancelled.status, 200);
  assert.equal((await cancelled.json()).task.status, 'cancelled');

  env.getState().botTasks.push({ id: 'task-2', businessId: 'biz-1', botId: 'writer', title: 'Draft', instructions: 'Write', status: 'running', progress: 10 });
  const activeCancel = await server.fetch(request('/api/crm/bot-task-update', { id: 'task-2', status: 'cancelled' }), env);
  assert.equal(activeCancel.status, 409);
});

test('legacy task states are normalized when a task is next updated', async () => {
  const env = createEnv({ businesses: [{ id: 'biz-1', name: 'Northstar' }], botTasks: [{
    id: 'task-legacy', businessId: 'biz-1', botId: 'writer', title: 'Draft', instructions: 'Write', status: 'in_progress', progress: 10,
  }] });
  const failed = await server.fetch(request('/api/crm/bot-task-update', { id: 'task-legacy', status: 'failed' }), env);
  assert.equal(failed.status, 200);
  assert.equal((await failed.json()).task.status, 'failed');
});

test('task execution persists preparing, running, completion, and available model metadata server-side', async () => {
  const env = createEnv({
    businesses: [{ id: 'biz-1', name: 'Northstar', industry: 'Cafe', businessProfile: { verified: true, offer: 'Coffee' } }],
    botTasks: [{ id: 'task-run', businessId: 'biz-1', botId: 'writer', ownerId: 'owner', title: 'Write a post', instructions: 'Use verified facts.', status: 'queued', progress: 0 }],
    chat: [],
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('<html></html>', { status: 200, headers: { 'Content-Type': 'text/html' } });
  let signalModelStarted;
  let finishModel;
  const modelStarted = new Promise((resolve) => { signalModelStarted = resolve; });
  const modelGate = new Promise((resolve) => { finishModel = resolve; });
  env.AI = { async chat() { signalModelStarted(); await modelGate; return { content: 'A carefully grounded coffee post.', provider: 'Websim AI', model: 'test-model' }; } };
  try {
    const runPromise = server.fetch(request('/api/crm/team-chat', {
      taskId: 'task-run', businessId: 'biz-1', botId: 'writer', content: 'Execute the task.',
    }), env);
    await modelStarted;
    const runningResponse = await server.fetch(new Request('https://project.test/api/crm/bot-task?id=task-run', {
      headers: { 'x-websim-user-id': 'owner', 'x-websim-project-owner-id': 'owner' },
    }), env);
    assert.equal((await runningResponse.json()).task.status, 'running');
    finishModel();
    const response = await runPromise;
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.task.status, 'completed');
    assert.equal(body.task.progress, 100);
    assert.equal(body.task.modelInfo.provider, 'Websim AI');
    assert.equal(body.task.modelInfo.model, 'test-model');
    assert.match(body.task.result, /carefully grounded coffee post/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
