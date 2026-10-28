import test from 'node:test';
import assert from 'node:assert/strict';
import server from '../server.js';

test('photo editor sends each actual image to engineer QA and only passes scores of eight or higher', async () => {
  const post = {
    id: 'post-1', businessId: 'biz-1', title: 'Fresh coffee', caption: 'A caption',
    visualBrief: 'A close-up of freshly brewed coffee in a neighborhood cafe.',
    imageUrl: 'https://images.example.test/coffee.jpg',
    researchSources: [{ title: 'Coffee trends', url: 'https://example.test/trends' }],
    engineerReview: { content: 'approved', visual: 'pending', notes: ['Copy passed.'] },
  };
  const state = { businesses: [{ id: 'biz-1', name: 'Example Cafe', industry: 'Cafe' }], posts: [post] };
  let sawImage = false;
  const env = {
    DB: {
      prepare(sql) {
        return {
          bind() {
            return {
              first: async () => ({ state_json: JSON.stringify(state) }),
              all: async () => ({ results: sql.includes('crm_posts') ? state.posts.map((item) => ({ post_json: JSON.stringify(item) })) : [] }),
              run: async () => ({ meta: { changes: 1 } }),
            };
          },
        };
      },
      async batch() { return []; },
    },
    AI: {
      async chat({ messages }) {
        const visualContent = messages.find((message) => message.role === 'user').content;
        sawImage = Array.isArray(visualContent) && visualContent.some((item) => item.type === 'image_url' && item.image_url.url === post.imageUrl);
        return { content: JSON.stringify({ posts: [{
          id: post.id, brightness: 102, contrast: 110, saturation: 105, warmth: 3,
          vignette: 10, aspectRatio: '1:1', movement: 'minimalist', overlayStyle: 'quiet',
          recommendedFont: 'Outfit', editorNote: 'Niche fit and clarity checked.',
          visualScore: 9, engineerApproved: true, visualIssues: '',
        }] }) };
      },
    },
  };
  const request = new Request('https://project.test/api/crm/adjust-photos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-websim-user-id': 'owner', 'x-websim-project-owner-id': 'owner' },
    body: JSON.stringify({ businessId: 'biz-1', postIds: [post.id] }),
  });

  const response = await server.fetch(request, env);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(sawImage, true);
  assert.equal(body.posts[0].engineerReview.visual, 'approved');
  assert.equal(body.posts[0].status, 'Ready for owner review');
});
