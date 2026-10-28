import test from 'node:test';
import assert from 'node:assert/strict';
import server from '../server.js';

test('separate bounded research and copy requests complete successfully', async () => {
  const originalFetch = globalThis.fetch;
  const searchCalls = [];
  globalThis.fetch = async (url) => {
    searchCalls.push(String(url));
    return new Response('<html></html>', { status: 200, headers: { 'Content-Type': 'text/html' } });
  };

  try {
    const state = {
      businesses: [{ id: 'biz-1', name: 'Example Cafe', industry: 'Cafe', channels: ['Instagram'] }],
      posts: [],
    };
    let writerInstruction = '';
    const env = {
      DB: {
        prepare() {
          return { bind() { return { first: async () => ({ state_json: JSON.stringify(state) }) }; } };
        },
      },
      AI: {
        async chat({ messages }) {
          writerInstruction = messages.find((message) => message.role === 'system').content;
          const prompt = messages.find((message) => message.role === 'user').content;
          const count = Number(prompt.match(/New post count: (\d+)/)?.[1] || 0);
          return { content: JSON.stringify({ posts: Array.from({ length: count }, (_, index) => ({ title: `Draft ${index + 1}`, caption: 'Original caption' })) }) };
        },
      },
    };
    const researchRequest = new Request('https://project.test/api/crm/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-websim-user-id': 'owner', 'x-websim-project-owner-id': 'owner' },
      body: JSON.stringify({ businessId: 'biz-1', instructions: 'Find niche examples', classification: { subNiche: 'Cafe', category: 'Food' } }),
    });
    const researchResponse = await server.fetch(researchRequest, env);
    const research = await researchResponse.json();
    assert.equal(researchResponse.status, 200);
    assert.equal(searchCalls.length, 4);

    const copyRequest = new Request('https://project.test/api/crm/generate-copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-websim-user-id': 'owner', 'x-websim-project-owner-id': 'owner' },
      body: JSON.stringify({ businessId: 'biz-1', count: 1, researchEnabled: false, sources: research.sources, workflow: {}, classification: { subNiche: 'Cafe', category: 'Food' } }),
    });

    const response = await server.fetch(copyRequest, env);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.posts.length, 1);
    assert.equal(searchCalls.length, 4);
    assert.match(writerInstruction, /English and Arabic/);
    assert.match(writerInstruction, /headline, sub, and visualBrief in English only/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('CRM batch writer returns ten distinct posts for one run', async () => {
  const state = { businesses: [{ id: 'biz-1', name: 'Example Cafe', industry: 'Cafe' }], posts: [] };
  const env = {
    DB: { prepare() { return { bind() { return { first: async () => ({ state_json: JSON.stringify(state) }) }; } }; } },
    AI: { async chat({ messages }) {
      const prompt = messages.find((message) => message.role === 'user').content;
      const count = Number(prompt.match(/New post count: (\d+)/)?.[1] || 0);
      return { content: JSON.stringify({ posts: Array.from({ length: count }, (_, index) => ({
        title: `Cafe angle ${index + 1}`,
        caption: `A different cafe story and practical detail number ${index + 1}.\n\nقصة مقهى مختلفة وتفصيل مفيد رقم ${index + 1}.`,
        headline: `Cafe idea ${index + 1}`,
        visualBrief: `A distinct cafe scene number ${index + 1}`,
        format: `Format ${index + 1}`,
      })) }) };
    } },
  };
  const request = new Request('https://project.test/api/crm/generate-copy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-websim-user-id': 'owner', 'x-websim-project-owner-id': 'owner' },
    body: JSON.stringify({ businessId: 'biz-1', count: 10, researchEnabled: false, workflow: {}, classification: { subNiche: 'Cafe', category: 'Food' } }),
  });

  const response = await server.fetch(request, env);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.posts.length, 10);
  assert.equal(new Set(body.posts.map((post) => post.title)).size, 10);
});

test('copy generation fills an incomplete writer response to the requested batch size', async () => {
  const state = { businesses: [{ id: 'biz-1', name: 'Example Cafe', industry: 'Cafe' }], posts: [] };
  const env = {
    DB: { prepare() { return { bind() { return { first: async () => ({ state_json: JSON.stringify(state) }) }; } }; } },
    AI: { async chat() { return { content: JSON.stringify({ posts: [{ title: 'One', caption: 'English\n\nArabic' }] }) }; } },
  };
  const request = new Request('https://project.test/api/crm/generate-copy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-websim-user-id': 'owner', 'x-websim-project-owner-id': 'owner' },
    body: JSON.stringify({ businessId: 'biz-1', count: 3, researchEnabled: false, workflow: {}, classification: { subNiche: 'Cafe', category: 'Food' } }),
  });

  const response = await server.fetch(request, env);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.posts.length, 3);
  assert.match(body.generationWarning, /incomplete batch/i);
});

test('copy generation returns flagged drafts when the AI writer rejects', async () => {
  const state = { businesses: [{ id: 'biz-1', name: 'Example Cafe', industry: 'Cafe' }], posts: [] };
  const env = {
    DB: { prepare() { return { bind() { return { first: async () => ({ state_json: JSON.stringify(state) }) }; } }; } },
    AI: { async chat() { throw new Error('model unavailable'); } },
  };
  const request = new Request('https://project.test/api/crm/generate-copy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-websim-user-id': 'owner', 'x-websim-project-owner-id': 'owner' },
    body: JSON.stringify({ businessId: 'biz-1', count: 3, researchEnabled: false, workflow: {}, classification: { subNiche: 'Cafe', category: 'Food' } }),
  });

  const response = await server.fetch(request, env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.posts.length, 3);
  assert.notEqual(body.posts[0].title, body.posts[1].title);
  assert.match(body.posts[0].caption, /\n\n.+[ء-ي]/s);
  assert.equal(body.posts[0].title.includes('Example Cafe'), true);
  assert.match(body.generationWarning, /owner review/i);
});

test('copy generation returns drafts instead of waiting for a stalled AI writer', async () => {
  const originalSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = (callback) => originalSetTimeout(callback, 0);
  try {
    const state = { businesses: [{ id: 'biz-1', name: 'Example Cafe', industry: 'Cafe' }], posts: [] };
    const env = {
      DB: { prepare() { return { bind() { return { first: async () => ({ state_json: JSON.stringify(state) }) }; } }; } },
      AI: { chat() { return new Promise(() => {}); } },
    };
    const request = new Request('https://project.test/api/crm/generate-copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-websim-user-id': 'owner', 'x-websim-project-owner-id': 'owner' },
      body: JSON.stringify({ businessId: 'biz-1', count: 3, researchEnabled: false, workflow: {}, classification: { subNiche: 'Cafe', category: 'Food' } }),
    });

    const response = await server.fetch(request, env);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.posts.length, 3);
    assert.match(body.generationWarning, /exceeded its time limit/i);
  } finally {
    globalThis.setTimeout = originalSetTimeout;
  }
});

test('copy generation replaces a repeated idea found in campaign history', async () => {
  const oldCaption = 'Try one simple way to plan your morning coffee before you leave home.\n\nجرب طريقة بسيطة لتخطيط قهوتك الصباحية قبل مغادرة المنزل.';
  const state = {
    businesses: [{ id: 'biz-1', name: 'Example Cafe', industry: 'Cafe' }],
    posts: [{ id: 'old-1', businessId: 'biz-1', title: 'Coffee planning', caption: oldCaption }],
  };
  const env = {
    DB: { prepare() { return { bind() { return { first: async () => ({ state_json: JSON.stringify(state) }) }; } }; } },
    AI: { async chat() { return { content: JSON.stringify({ posts: [{ title: 'Coffee planning again', caption: oldCaption }] }) }; } },
  };
  const request = new Request('https://project.test/api/crm/generate-copy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-websim-user-id': 'owner', 'x-websim-project-owner-id': 'owner' },
    body: JSON.stringify({ businessId: 'biz-1', count: 1, sources: [], workflow: {}, classification: { subNiche: 'Cafe', category: 'Food' } }),
  });
  const response = await server.fetch(request, env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.posts.length, 1);
  assert.notEqual(body.posts[0].caption, oldCaption);
  assert.match(body.generationWarning, /repeated concepts were replaced/i);
});
