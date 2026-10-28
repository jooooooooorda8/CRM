export async function postWorkflowJson(url, payload, { attempts = 3, fetchImpl = fetch } = {}) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.status === 502) {
        const details = await response.clone().json().catch(() => null);
        if (/did not respond within \d+ms/i.test(String(details?.message || ''))) return response;
      }
      if (response.ok || (response.status < 500 && response.status !== 429) || attempt === attempts - 1) {
        return response;
      }
      lastError = new Error(`Workflow request failed (${response.status})`);
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
  }
  throw lastError || new Error('Workflow request failed.');
}

export function resolveWorkflowDrafts(originalPosts, reviewResponse, requestedCount) {
  const reviewedPosts = reviewResponse?.ok && reviewResponse.data?.reviewed !== false && Array.isArray(reviewResponse.data?.posts)
    && reviewResponse.data.posts.length === Math.min(requestedCount, originalPosts.length)
    ? reviewResponse.data.posts
    : null;
  const drafts = (reviewedPosts || originalPosts).slice(0, requestedCount).map((draft, index) => ({
    ...originalPosts[index],
    ...draft,
  }));
  return { drafts, reviewed: !!reviewedPosts };
}
