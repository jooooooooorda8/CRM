export const schema =
  "CREATE TABLE IF NOT EXISTS crm_state (" +
  "user_id TEXT PRIMARY KEY, state_json TEXT NOT NULL, updated_at TEXT NOT NULL);" +
  "CREATE TABLE IF NOT EXISTS crm_posts (" +
  "user_id TEXT NOT NULL, post_id TEXT NOT NULL, created_at TEXT NOT NULL, post_json TEXT NOT NULL, PRIMARY KEY (user_id, post_id));" +
  "CREATE TABLE IF NOT EXISTS crm_photo_usage (" +
  "user_id TEXT NOT NULL, photo_key TEXT NOT NULL, source_key TEXT NOT NULL, image_url TEXT NOT NULL, title TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (user_id, photo_key), UNIQUE (user_id, source_key))";

const json = (data, status = 200) => Response.json(data, { status });
const makeId = (prefix) => prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function imageContext(input = {}, business = {}, brief = "") {
  const supplied = input.classification && typeof input.classification === "object" ? input.classification : {};
  const safe = (value, fallback) => String(value || fallback).slice(0, 500);
  const context = {
    category: safe(supplied.category, business.industry || "Professional Services"),
    subNiche: safe(business.businessProfile?.subNiche || supplied.subNiche, business.industry || brief || "General business"),
    businessType: safe(supplied.businessType, business.industry || "Local business"),
    likelyCustomer: safe(supplied.likelyCustomer, business.businessProfile?.audience || business.audience || "Egyptian customers"),
    photographyStyle: safe(supplied.photographyStyle, "specific commercial documentary photography that shows the real product, service or place"),
    brandVisualDirection: safe(supplied.brandVisualDirection, business.businessProfile?.visualDirection || ""),
    serviceArea: safe(supplied.serviceArea, business.businessProfile?.serviceArea || "Egypt"),
    contextDirection: safe(supplied.contextDirection, "Use believable Egyptian architecture, streets, businesses, people, products and cultural details where relevant. Avoid generic Western stock-photo cues."),
  };
  const suppliedQueries = Array.isArray(supplied.searchQueries)
    ? supplied.searchQueries.map((value) => String(value || "").slice(0, 140)).filter(Boolean)
    : [context.subNiche, business.industry, `${context.category} Egypt`].filter(Boolean);
  context.searchQueries = [...new Set([brief.slice(0, 140), ...suppliedQueries])].filter(Boolean).slice(0, 4);
  const suppliedTerms = Array.isArray(supplied.relevanceTerms)
    ? supplied.relevanceTerms.map((value) => String(value || "").slice(0, 100)).filter(Boolean)
    : [context.subNiche, context.category, business.industry].filter(Boolean);
  context.relevanceTerms = [...new Set([context.subNiche, context.category, brief.slice(0, 100), ...suppliedTerms])].filter(Boolean).slice(0, 10);
  context.searchQuery = safe(supplied.searchQuery, brief || context.searchQueries[0] || context.subNiche);
  return context;
}

function nicheImagePrompt({ classification, business = {}, brief = "", previous = "", purpose = "commercial campaign" }) {
  const brandDirection = classification.brandVisualDirection || business.businessProfile?.visualDirection || "Keep the scene consistent with the business's existing visual identity.";
  const serviceArea = classification.serviceArea || business.businessProfile?.serviceArea || "Egypt";
  const verifiedProfile = business.businessProfile?.verified === true;
  const offer = verifiedProfile ? business.businessProfile?.offer || "" : "";
  const description = verifiedProfile ? business.businessProfile?.verifiedDescription || business.description || "" : "";
  const palette = JSON.stringify(business.websiteInsights?.colors || []);
  return `Create one original ${purpose} photograph for ${business.name || "a business"}. Primary Egyptian niche: ${classification.category}. Specific sub-niche: ${classification.subNiche}. Prioritize this primary niche and sub-niche; secondary services in the business profile are context only and must not replace the main subject. Business type: ${classification.businessType}. Likely customer: ${classification.likelyCustomer}. Visual direction: ${classification.photographyStyle}. Brand visual direction: ${brandDirection}. Brand palette: ${palette}. A logo is supplied separately when available; do not invent, draw, or alter logos or text. Location or service area: ${serviceArea}. Business description (owner-verified only): ${description}. Products or services (owner-verified only): ${offer}. Campaign brief: ${brief || classification.subNiche}. ${classification.contextDirection} Show the actual product, service, place or customer experience; favor an authentic, specific scene over generic stock imagery. Distinct scene from these prior subjects: ${previous || "none"}. Create a clean photographic image only. Absolutely no visible writing of any kind: no letters, words, numbers, captions, signs, labels, menus, packaging text, screen text, interface copy, logos, watermarks, or fake brand marks. If a phone, computer, display, poster, or package is essential to the scene, show its screen or surface blank, abstract, or out of focus. Do not depict a designed advertisement or mockup. Leave any campaign wording to be typeset separately by the app.`;
}

function normalizeCopy(value = "") {
  return String(value).toLowerCase().normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}

function copySimilarity(left = "", right = "") {
  const a = new Set(normalizeCopy(left).split(" ").filter((word) => word.length > 1));
  const b = new Set(normalizeCopy(right).split(" ").filter((word) => word.length > 1));
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared++;
  return shared / (a.size + b.size - shared);
}

function captionLanguages(value = "") {
  const parts = String(value).split(/\n\s*\n/);
  return [parts[0] || "", parts.slice(1).join(" ") || ""];
}

function isDuplicatePost(candidate, previous) {
  const candidateCaption = normalizeCopy(candidate.caption);
  const candidateLanguages = captionLanguages(candidate.caption);
  return previous.some((post) => {
    const priorCaption = normalizeCopy(post.caption);
    if (candidateCaption && candidateCaption === priorCaption) return true;
    const priorLanguages = captionLanguages(post.caption);
    const captionOverlap = Math.max(copySimilarity(candidateLanguages[0], priorLanguages[0]), copySimilarity(candidateLanguages[1], priorLanguages[1]));
    const titleOverlap = copySimilarity(candidate.title, post.title);
    const headlineOverlap = copySimilarity(candidate.headline, post.headline);
    return captionOverlap >= 0.84 || (titleOverlap >= 0.9 && headlineOverlap >= 0.75 && captionOverlap >= 0.55);
  });
}

function fallbackCopyPosts(business, classification, count, existingTitles = [], existingPosts = []) {
  const name = String(business.name || "Our team").trim();
  const niche = String(classification.subNiche || business.industry || "our services").trim();
  const angles = [
    [`A useful question before choosing ${niche}: what matters most for your situation? Share your priorities with ${name} and start with the details that fit.`, `قبل اختيار ${niche}، اسأل نفسك: ما الأهم لاحتياجاتك؟ شارك أولوياتك مع ${name} وابدأ بالتفاصيل المناسبة.`],
    [`Looking into ${niche}? A short list of your needs can make the options easier to compare. Tell ${name} what you are looking for and take the next step with clear information.`, `هل تبحث عن ${niche}؟ كتابة احتياجاتك تساعدك على مقارنة الخيارات. أخبر ${name} بما تبحث عنه وابدأ بخطوة واضحة.`],
    [`Start with the outcome you want from ${niche}, then ask the practical questions that help you choose. ${name} is ready to hear what you have in mind.`, `ابدأ بالنتيجة التي تريدها من ${niche}، ثم اسأل الأسئلة التي تساعدك على الاختيار. ${name} مستعد لمعرفة ما تبحث عنه.`],
    [`A thoughtful choice starts with the right details. When exploring ${niche}, note your priorities and ask ${name} about the information available for your needs.`, `الاختيار المدروس يبدأ بالتفاصيل المناسبة. عند استكشاف ${niche}، حدد أولوياتك واسأل ${name} عن المعلومات التي تناسب احتياجاتك.`],
    [`There is more than one way to approach ${niche}. Describe your goals to ${name} and get a conversation started around the details that matter to you.`, `هناك أكثر من طريقة للتعامل مع ${niche}. شارك أهدافك مع ${name} وابدأ حوارًا حول التفاصيل المهمة لك.`],
    [`If ${niche} is on your list, begin with one clear question about your needs. ${name} welcomes your message and can help you find a suitable next step.`, `إذا كانت ${niche} ضمن خططك، ابدأ بسؤال واضح عن احتياجاتك. ${name} يرحب برسالتك ويساعدك في تحديد الخطوة المناسبة.`],
    [`Make your search for ${niche} more focused: write down what you need, what you already know, and what you still want to ask ${name}.`, `اجعل بحثك عن ${niche} أكثر تركيزًا: اكتب ما تحتاجه وما تعرفه وما تريد أن تسأل عنه ${name}.`],
    [`A good conversation about ${niche} starts with your point of view. Tell ${name} what you hope to find, and explore the available details together.`, `الحوار الجيد حول ${niche} يبدأ من وجهة نظرك. أخبر ${name} بما تأمل أن تجده واستكشفا التفاصيل المتاحة معًا.`],
    [`Before comparing ${niche} options, decide which two or three needs matter most to you. Share that shortlist with ${name} to make the conversation more useful.`, `قبل مقارنة خيارات ${niche}، حدد أهم احتياجين أو ثلاثة بالنسبة لك. شارك هذه القائمة مع ${name} لتكون المحادثة أكثر فائدة.`],
    [`Not sure where to begin with ${niche}? Write down what a good result would look like for you, then ask ${name} which details are useful to consider first.`, `لست متأكدًا من أين تبدأ في ${niche}؟ اكتب كيف تبدو النتيجة المناسبة لك، ثم اسأل ${name} عن التفاصيل التي يجدر التفكير فيها أولًا.`],
    [`A clearer brief leads to a clearer conversation about ${niche}. Include your goal, timing, and main question when you contact ${name}.`, `التفاصيل الواضحة تساعد على بدء نقاش أوضح حول ${niche}. اذكر هدفك والوقت المناسب وأهم سؤال لديك عند التواصل مع ${name}.`],
    [`One simple way to explore ${niche}: separate what you need now from what would simply be nice to have. ${name} can discuss the priorities with you.`, `طريقة بسيطة لاستكشاف ${niche}: ميّز بين ما تحتاجه الآن وما سيكون إضافة جيدة فقط. يمكن لـ ${name} مناقشة أولوياتك معك.`],
    [`When asking about ${niche}, bring the questions you would want answered before making a decision. ${name} is open to hearing what matters in your case.`, `عند السؤال عن ${niche}، جهز الأسئلة التي تحتاج إلى إجاباتها قبل اتخاذ القرار. ${name} مستعد لمعرفة ما يهمك في حالتك.`],
    [`Your needs are a helpful starting point for ${niche}. Tell ${name} what you have already considered and what is still unclear, so the next step can fit you.`, `احتياجاتك بداية مفيدة عند التفكير في ${niche}. أخبر ${name} بما فكرت فيه وما لا يزال غير واضح، لتكون الخطوة التالية مناسبة لك.`],
    [`Try this before your next ${niche} conversation: name the outcome you want, list your open questions, and decide what information would help you choose.`, `جرّب ذلك قبل محادثتك القادمة حول ${niche}: حدد النتيجة التي تريدها، واكتب أسئلتك، وقرر ما المعلومات التي ستساعدك على الاختيار.`],
    [`Good decisions about ${niche} start with understanding your own priorities. What would make the biggest difference for you? Share your answer with ${name}.`, `القرار الجيد بشأن ${niche} يبدأ بفهم أولوياتك. ما أكثر شيء سيحدث فرقًا لك؟ شارك إجابتك مع ${name}.`],
  ];
  const generated = [];
  for (let index = 0; index < count; index++) {
    const ordinal = existingTitles.length + index + 1;
    const previous = [...existingPosts, ...generated];
    let chosen = -1;
    const start = (ordinal - 1) % angles.length;
    for (let attempt = 0; attempt < angles.length; attempt++) {
      const candidateIndex = (start + attempt) % angles.length;
      const candidate = { title: `${name}: ${niche} · ${ordinal}`, caption: `${angles[candidateIndex][0]}\n\n${angles[candidateIndex][1]}` };
      if (!isDuplicatePost(candidate, previous)) { chosen = candidateIndex; break; }
    }
    if (chosen < 0) throw new Error("No distinct template draft is available for this business history.");
    generated.push({
      title: `${name}: ${niche} · ${ordinal}`.slice(0, 140),
      caption: `${angles[chosen][0]}\n\n${angles[chosen][1]}`,
      headline: `Discover ${niche} · ${ordinal}`.slice(0, 80),
      sub: name.slice(0, 120),
      visualBrief: `Create a fresh editorial photo concept for ${niche} at ${name}; use a different subject, setting, camera angle, and color story from previous campaign images. No lettering or logos.`,
      format: ["Question-led post", "Practical guide", "Conversation starter", "Customer checklist"][index % 4],
    });
  }
  return generated;
}

function ownerId(request) {
  const userId = request.headers.get("x-websim-user-id");
  const projectOwnerId = request.headers.get("x-websim-project-owner-id");
  return userId && projectOwnerId && userId === projectOwnerId ? userId : null;
}

async function loadState(env, userId, includePosts = true, migratePhotoHistory = false) {
  const row = await env.DB.prepare("SELECT state_json FROM crm_state WHERE user_id = ?").bind(userId).first();
  if (!row) return null;
  try {
    const state = JSON.parse(row.state_json);
    const packedPosts = Array.isArray(state.posts) ? state.posts : [];
    let results = [];
    if (includePosts) {
      const rows = await env.DB.prepare("SELECT post_json FROM crm_posts WHERE user_id = ? ORDER BY created_at DESC").bind(userId).all();
      results = rows.results || [];
      if (results.length) state.posts = results.flatMap((item) => { try { return [JSON.parse(item.post_json)]; } catch { return []; } });
      else state.posts = packedPosts;
      if (migratePhotoHistory) await ensurePostPhotoHistory(env, userId, state.posts);
    } else {
      state.posts = packedPosts;
    }
    Object.defineProperty(state, "__postsBacked", { value: results.length > 0 || (packedPosts.length === 0 && Array.isArray(state.posts)), enumerable: false });
    return state;
  } catch { return null; }
}

async function saveState(env, userId, state, persistPosts = true) {
  const posts = Array.isArray(state.posts) ? state.posts : [];
  if (persistPosts) {
    for (let index = 0; index < posts.length; index += 40) {
      const batch = posts.slice(index, index + 40).map((post) => env.DB.prepare(
        "INSERT INTO crm_posts (user_id, post_id, created_at, post_json) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, post_id) DO UPDATE SET created_at = excluded.created_at, post_json = excluded.post_json WHERE post_json != excluded.post_json OR created_at != excluded.created_at"
      ).bind(userId, String(post.id), String(post.createdAt || new Date().toISOString()), JSON.stringify(post)));
      if (batch.length) await env.DB.batch(batch);
    }
  }
  const compactState = { ...state, posts: persistPosts || state.__postsBacked ? [] : posts };
  // Swarm drafts already live in crm_posts. Keep only the latest run summary
  // and its editable script/voice data in the workspace row; Blob objects,
  // preview object URLs, old runs, and duplicated render prompts can make the
  // single-row workspace exceed its 120 KB storage bound.
  compactState.businesses = (compactState.businesses || []).map((business) => {
    const runs = Array.isArray(business.swarmRuns) ? business.swarmRuns : [];
    if (!runs.length) return business;
    const latest = runs[runs.length - 1];
    return {
      ...business,
      swarmRuns: [{
        id: String(latest.id || ""), title: String(latest.title || business.name || "Swarm run").slice(0, 140),
        createdAt: latest.createdAt, updatedAt: latest.updatedAt, workflowName: latest.workflowName,
        sources: Array.isArray(latest.sources) ? latest.sources.slice(0, 3).map((source) => ({ title: String(source.title || "").slice(0, 120), url: String(source.url || "").slice(0, 300), snippet: String(source.snippet || "").slice(0, 180) })) : [],
        videos: (Array.isArray(latest.videos) ? latest.videos : []).slice(0, 5).map((video, index) => ({
          videoNum: index + 1, title: String(video.title || `Video ${index + 1}`).slice(0, 140), style: String(video.style || "").slice(0, 80),
          angle: String(video.angle || "").slice(0, 240), hook: String(video.hook || "").slice(0, 300), cta: String(video.cta || "").slice(0, 300),
          spokenScript: String(video.spokenScript || "").slice(0, 2400), script: String(video.script || "").slice(0, 4000), ssml: String(video.ssml || "").slice(0, 5000),
          voiceId: String(video.voiceId || ""), voiceUrl: String(video.voiceUrl || "").slice(0, 1000), duration: String(video.duration || ""), durationSeconds: Number(video.durationSeconds) || 0,
          aspectRatio: String(video.aspectRatio || "9:16"), visuals: String(video.visuals || "").slice(0, 1800), avatar: String(video.avatar || "").slice(0, 1000),
          render: video.render && typeof video.render === "object" ? video.render : {}, renderState: String(video.renderState || ""), approved: !!video.approved, videoUrl: String(video.videoUrl || "").slice(0, 1000),
        })),
      }],
    };
  });
  let value = JSON.stringify(compactState);
  if (value.length > 120000) {
    // Retain scripts and narration URLs while dropping duplicated, editable
    // prompt payloads before failing a workspace save.
    compactState.businesses = compactState.businesses.map((business) => ({
      ...business,
      swarmRuns: (business.swarmRuns || []).map((run) => ({
        ...run,
        sources: [],
        videos: (run.videos || []).map(({ visuals, avatar, render, ssml, ...video }) => video),
      })),
    }));
    value = JSON.stringify(compactState);
  }
  if (value.length > 120000) {
    // Keep the most recently updated Swarm run fully editable, while reducing
    // older business runs to concise outcomes. CRM posts retain the complete
    // draft payload, and browser local storage keeps the active render data.
    let newest = { businessId: null, runId: null, updatedAt: "" };
    for (const business of compactState.businesses || []) {
      for (const run of business.swarmRuns || []) {
        const updatedAt = String(run.updatedAt || run.createdAt || "");
        if (updatedAt >= newest.updatedAt) newest = { businessId: business.id, runId: run.id, updatedAt };
      }
    }
    compactState.businesses = (compactState.businesses || []).map((business) => ({
      ...business,
      swarmRuns: (business.swarmRuns || []).map((run) => {
        if (business.id === newest.businessId && run.id === newest.runId) return run;
        return {
          id: run.id, title: run.title, createdAt: run.createdAt, updatedAt: run.updatedAt,
          workflowName: run.workflowName,
          videos: (run.videos || []).map((video) => ({ videoNum: video.videoNum, title: video.title, style: video.style, approved: video.approved, videoUrl: video.videoUrl })),
        };
      }),
    }));
    value = JSON.stringify(compactState);
  }
  if (value.length > 120000) throw new Error(`Workspace is too large to save (${value.length} characters after Swarm data compaction).`);
  await env.DB.prepare(
    "INSERT INTO crm_state (user_id, state_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at"
  ).bind(userId, value, new Date().toISOString()).run();
}

async function storedPosts(env, userId, state) {
  try {
    const result = await env.DB.prepare("SELECT post_json FROM crm_posts WHERE user_id = ? ORDER BY created_at DESC").bind(userId).all();
    const posts = (result.results || []).flatMap((row) => { try { return [JSON.parse(row.post_json)]; } catch { return []; } });
    return posts.length ? posts : (state.posts || []);
  } catch {
    return state.posts || [];
  }
}

function normalizeLegacyTask(task) {
  const legacy = task.status;
  if (legacy === "in_progress") {
    task.status = "failed";
    task.startedAt = null;
    task.completedAt = task.completedAt || new Date().toISOString();
    task.activeStep = "Legacy run interrupted before backend job tracking";
    task.engineerNote = "The previous client-managed run could not be verified after reload. Run it again to start a backend-tracked job.";
  }
  if (legacy === "complete") { task.status = "completed"; task.reviewStatus = "approved"; }
  if (legacy === "needs_review") {
    task.status = task.result ? "completed" : "failed";
    task.reviewStatus = task.result ? "pending" : undefined;
  }
  return task;
}

function publicState(state) {
  return { ...state, content: state.posts || [], tasks: state.botTasks || [] };
}

function photoKey(value) {
  try {
    const parsed = new URL(value, "https://findat.local");
    return parsed.origin + parsed.pathname;
  } catch { return String(value || "").split("?")[0]; }
}

async function ensurePostPhotoHistory(env, userId, posts) {
  const photos = [...new Map((posts || []).filter((post) => post.imageUrl).map((post) => {
    const url = String(post.imageUrl);
    const key = photoKey(url);
    const source = String(post.imageSource?.id || key).slice(0, 500);
    return [key, { key, source, url, title: String(post.title || "Photo").slice(0, 240) }];
  })).values()];
  for (let index = 0; index < photos.length; index += 40) {
    const batch = photos.slice(index, index + 40).map((photo) => env.DB.prepare(
      "INSERT OR IGNORE INTO crm_photo_usage (user_id, photo_key, source_key, image_url, title, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(userId, photo.key, photo.source, photo.url, photo.title, new Date().toISOString()));
    if (batch.length) await env.DB.batch(batch);
  }
}

function photoText(value = "") {
  return String(value).toLowerCase().normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "").replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function photoRelevance(item, classification) {
  const tags = Array.isArray(item.tags) ? item.tags.map((tag) => typeof tag === "string" ? tag : tag?.name || "") : [];
  const title = photoText(item.title || "");
  const evidence = photoText([item.title, item.description, ...tags].filter(Boolean).join(" "));
  const terms = Array.isArray(classification.relevanceTerms) ? classification.relevanceTerms : [classification.subNiche, classification.category];
  let score = 0;
  for (const term of terms) {
    const normalized = photoText(term);
    if (normalized.length < 3) continue;
    if (title.includes(normalized)) score += normalized.includes(" ") ? 8 : 5;
    else if (evidence.includes(normalized)) score += normalized.includes(" ") ? 5 : 3;
    for (const word of normalized.split(" ").filter((part) => part.length >= 4)) {
      if (evidence.includes(word)) score += 1;
    }
  }
  return score;
}

async function searchOpenverse(classification, pageSize) {
  const queries = [...new Set([
    ...(classification.searchQueries || []),
    classification.searchQuery,
  ].map((query) => String(query || "").trim()).filter(Boolean))].slice(0, 3);
  const responses = await Promise.allSettled(queries.map(async (query) => {
    const endpoint = new URL("https://api.openverse.org/v1/images/");
    endpoint.searchParams.set("q", query);
    endpoint.searchParams.set("category", "photograph");
    endpoint.searchParams.set("license_type", "commercial");
    endpoint.searchParams.set("page_size", String(pageSize));
    const response = await fetch(endpoint, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(3500) });
    if (!response.ok) return [];
    const payload = await response.json();
    return payload.results || [];
  }));
  const items = responses.flatMap((response) => response.status === "fulfilled" ? response.value : []);
  return [...new Map(items.filter((item) => item.url).map((item) => [String(item.id || item.url), item])).values()];
}

function decodeSearchHtml(value = "") {
  return String(value).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&#x([\da-f]+);/gi, (_, value) => String.fromCodePoint(parseInt(value, 16)))
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function researchContent(business, classification, scoutInstructions = "") {
  const niche = classification.subNiche || business.industry || "local business";
  const place = classification.serviceArea || business.businessProfile?.serviceArea || "Egypt";
  const directive = String(scoutInstructions || "").replace(/[\r\n]+/g, " ").trim().slice(0, 180);
  const queries = [
    `"${niche}" ${place} business social media campaign examples`,
    `${niche} ${place} customer questions needs current trends`,
    `${niche} successful advertising campaign case study audience`,
    `site:instagram.com/p "${niche}" ${place} business post`,
    `site:facebook.com "${niche}" ${place} business post OR advertisement`,
    `site:tiktok.com "${niche}" ${place} business video`,
    `site:linkedin.com/posts "${niche}" ${place} campaign`,
    `site:youtube.com "${niche}" ${place} business campaign`,
    `site:pinterest.com "${niche}" ${place} business campaign`,
    `site:x.com "${niche}" ${place} business post`,
    `site:facebook.com/ads/library "${niche}" ${place}`,
    ...(directive ? [`"${niche}" ${place} ${directive} public social campaign`] : []),
  ];
  // Research is a separate workflow stage. Keep it bounded so every niche is checked quickly before copy generation.
  const resultSets = await Promise.allSettled(queries.slice(0, 4).map(async (query) => {
    const endpoint = new URL("https://www.bing.com/search");
    endpoint.searchParams.set("q", query);
    const response = await fetch(endpoint, {
      headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125 Safari/537.36", Accept: "text/html" },
      signal: AbortSignal.timeout(4500),
    });
    if (!response.ok) return [];
    const html = await response.text();
    const results = [...html.matchAll(/<li class="b_algo"[^>]*>([\s\S]*?)<\/li>/gi)];
    return results.slice(0, 5).map((match) => {
      const block = match[1];
      const anchor = block.match(/<h2[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!anchor) return null;
      let href = anchor[1].replace(/&amp;/g, "&");
      try {
        const parsed = new URL(href, "https://www.bing.com");
        const encoded = parsed.searchParams.get("u");
        if (encoded?.startsWith("a1")) href = atob(encoded.slice(2));
      } catch {}
      const snippetHtml = block.match(/class="b_lineclamp2"[^>]*>([\s\S]*?)<\//i)?.[1] || block.match(/class="b_caption"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || "";
      let hostname = "";
      try { hostname = new URL(href).hostname.replace(/^www\./, ""); } catch {}
      const platform = /instagram\.com$/i.test(hostname) ? "Instagram"
        : /facebook\.com$/i.test(hostname) ? "Facebook"
        : /tiktok\.com$/i.test(hostname) ? "TikTok"
        : /linkedin\.com$/i.test(hostname) ? "LinkedIn"
        : /youtube\.com$/i.test(hostname) ? "YouTube"
        : /pinterest\.com$/i.test(hostname) ? "Pinterest"
        : /(^|\.)x\.com$|twitter\.com$/i.test(hostname) ? "X" : hostname;
      const kind = /ads\/library/i.test(href) || /ad library|advertisement|sponsored/i.test(`${anchor[2]} ${snippetHtml}`) ? "ad-example"
        : ["Instagram", "Facebook", "TikTok", "LinkedIn", "YouTube", "Pinterest", "X"].includes(platform) ? "social-post" : "web-reference";
      return { title: decodeSearchHtml(anchor[2]).slice(0, 180), url: href, snippet: decodeSearchHtml(snippetHtml).slice(0, 320), query, platform, kind };
    }).filter((item) => item && item.title && item.url.startsWith("https://"));
  }));
  const unique = [...new Map(resultSets.flatMap((item) => item.status === "fulfilled" ? item.value : []).map((item) => [item.url, item])).values()];
  const social = unique.filter((item) => item.kind === "social-post" || item.kind === "ad-example");
  const general = unique.filter((item) => item.kind === "web-reference");
  return [...social.slice(0, 8), ...general.slice(0, 4)].slice(0, 12);
}

async function usedPhotos(env, userId, state) {
  const keys = new Set();
  const sources = new Set();
  const titles = [];
  for (const post of state.posts || []) {
    if (post.imageUrl) keys.add(photoKey(post.imageUrl));
    if (post.imageSource?.id) sources.add(String(post.imageSource.id));
    if (post.imageSource?.title) titles.push(String(post.imageSource.title));
  }
  const { results = [] } = await env.DB.prepare("SELECT photo_key, source_key, title FROM crm_photo_usage WHERE user_id = ?").bind(userId).all();
  for (const item of results) {
    keys.add(item.photo_key);
    sources.add(item.source_key);
    if (item.title) titles.push(item.title.includes("\t") ? item.title.split("\t").slice(1).join("\t") : item.title);
  }
  return { keys, sources, titles };
}

async function reservePhoto(env, userId, imageUrl, sourceId, title) {
  const key = photoKey(imageUrl);
  const sourceKey = String(sourceId || key).slice(0, 500);
  const claimId = makeId("claim");
  await env.DB.prepare(
    "INSERT OR IGNORE INTO crm_photo_usage (user_id, photo_key, source_key, image_url, title, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(userId, key, sourceKey, imageUrl, claimId + "\t" + String(title || "Photo").slice(0, 240), new Date().toISOString()).run();
  const row = await env.DB.prepare("SELECT title FROM crm_photo_usage WHERE user_id = ? AND photo_key = ?").bind(userId, key).first();
  return row?.title?.startsWith(claimId + "\t") || false;
}

function teachPhotoUniqueness(state) {
  state.learning = state.learning || [];
  const note = "Never reuse a photo URL or asset ID already used in any campaign. Check photo history before assigning imagery; if no fresh image is available, generate a new one or stop and ask for another source. Do not fall back to a previously used photo.";
  if (!state.learning.some((item) => item.kind === "photo_uniqueness_rule")) {
    state.learning.unshift({ id: makeId("learning"), bot_id: "lead", kind: "photo_uniqueness_rule", note, source: "owner_instruction", created_at: new Date().toISOString() });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const userId = ownerId(request);
    const requireOwner = () => userId ? null : json({ error: "Sign in as the project owner to change this workspace." }, 401);
    const read = async (includePosts = true, migratePhotoHistory = false) => userId ? await loadState(env, userId, includePosts, migratePhotoHistory) : null;
    const body = async () => { try { return await request.json(); } catch { return null; } };

    if (path === "/api/crm/bootstrap" && request.method === "GET") {
      const state = await read(true, true);
      if (state && Array.isArray(state.botTasks)) {
        let migrated = false;
        for (const task of state.botTasks) {
          const previous = task.status;
          normalizeLegacyTask(task);
          migrated ||= previous !== task.status;
        }
        if (migrated) await saveState(env, userId, state, false);
      }
      return json(state ? publicState(state) : { businesses: [], content: [], tasks: [], workflows: [], learning: [], chat: [] });
    }

    if (path === "/api/crm/bootstrap" && request.method === "POST") {
      const denied = requireOwner();
      if (denied) return denied;
      const seed = await body();
      if (!seed || !Array.isArray(seed.businesses) || !Array.isArray(seed.posts)) return json({ error: "Invalid workspace seed." }, 400);
      if (!(await loadState(env, userId, false))) await saveState(env, userId, seed);
      return json({ ok: true });
    }

    if (path === "/api/crm/search-photo" && request.method === "POST") {
      const denied = requireOwner();
      if (denied) return denied;
      const input = await body() || {};
      const state = await read(false);
      if (!state) return json({ error: "Workspace is not initialized." }, 409);
      const business = state.businesses.find((item) => item.id === input.businessId);
      if (!business) return json({ error: "Business not found." }, 404);
      const brief = String(input.brief || "").slice(0, 300);
      const classification = imageContext(input, business, brief);
      teachPhotoUniqueness(state);
      const used = await usedPhotos(env, userId, state);
      let selected = null;
      let generationError = null;

      if (input.imageMode !== "ai-first") {
        try {
          const candidates = (await searchOpenverse(classification, 30))
            .map((item) => ({ item, relevance: photoRelevance(item, classification) }))
            .filter((entry) => entry.relevance > 0)
            .sort((a, b) => b.relevance - a.relevance);
          for (const { item } of candidates) {
            if (!item.url || !String(item.url).startsWith("https://")) continue;
            const key = photoKey(item.url);
            const sourceId = String(item.id || key);
            if (used.keys.has(key) || used.sources.has(sourceId)) continue;
            if (await reservePhoto(env, userId, item.url, sourceId, item.title)) {
              selected = { assetId: sourceId, url: item.url, source: { type: "openverse", provider: "Openverse", id: sourceId, title: item.title || "Photograph", creator: item.creator || "Unknown creator", license: String(item.license || "License details unavailable").toUpperCase(), licenseUrl: item.license_url || "https://openverse.org/", foreign_landing_url: item.foreign_landing_url || item.url } };
              break;
            }
          }
        } catch {}
      }

      if (!selected) {
        try {
          const previous = used.titles.slice(-24).join("; ");
          const result = await env.AI.generateImage({ prompt: nicheImagePrompt({ classification, business, brief, previous, purpose: "commercial campaign" }), aspectRatio: "1:1" });
          if (!result?.url) throw new Error(result?.error || "Image generation returned no image.");
          const sourceId = makeId("generated-photo");
          if (await reservePhoto(env, userId, result.url, sourceId, brief || "Original AI campaign photo")) {
            selected = { assetId: sourceId, url: result.url, source: { type: "ai", provider: "Websim AI", id: sourceId, title: brief || "Original campaign photo", license: "AI-generated" } };
          }
        } catch (error) {
          generationError = error instanceof Error ? error.message : String(error);
        }
      }

      if (!selected && generationError) {
        return json({ error: "Image generation failed: " + generationError }, 503);
      }
      if (!selected) return json({ error: "No unused photo is available. The workflow stopped rather than reusing an image." }, 409);
      await saveState(env, userId, state, false);
      return json(selected);
    }

    if (path === "/api/crm/research" && request.method === "POST") {
      const denied = requireOwner();
      if (denied) return denied;
      const input = await body() || {};
      const state = await read(false);
      if (!state) return json({ error: "Workspace is not initialized." }, 409);
      const business = state.businesses.find((item) => item.id === input.businessId);
      if (!business) return json({ error: "Business not found." }, 404);
      const classification = imageContext(input, business);
      const sources = await researchContent(business, classification, input.instructions);
      return json({ sources, researchStatus: sources.length ? "web-researched" : "no-web-results" });
    }

    if (path === "/api/crm/generate-copy" && request.method === "POST") {
      const denied = requireOwner();
      if (denied) return denied;
      const input = await body() || {};
      const state = await read(false);
      if (!state) return json({ error: "Workspace is not initialized." }, 409);
      const business = state.businesses.find((item) => item.id === input.businessId);
      if (!business) return json({ error: "Business not found." }, 404);
      const classification = imageContext(input, business, String(input.topic || "").slice(0, 300));
      const count = Math.max(1, Math.min(10, Math.floor(Number(input.count) || 1)));
      const workflow = input.workflow || {};
      const sources = Array.isArray(input.sources)
        ? input.sources.slice(0, 12)
        : input.researchEnabled === false ? [] : await researchContent(business, classification, workflow.stepInstructions?.scout);
      const sourceContext = sources.map((item, index) => `${index + 1}. [${item.platform} · ${item.kind}] ${item.title} — ${item.snippet} (${item.url})`).join("\n").slice(0, 7000);
      const allPosts = (await storedPosts(env, userId, state)).filter((post) => post.businessId === input.businessId);
      const clientHistory = Array.isArray(input.existingPosts) ? input.existingPosts.filter((post) => post && post.businessId === input.businessId) : [];
      const existingPosts = [...new Map([...allPosts, ...clientHistory].filter((post) => post.id).map((post) => [String(post.id), post])).values()];
      const existingTitles = [...new Set([...existingPosts.map((post) => String(post.title || "").slice(0, 140)), ...(Array.isArray(input.existingTitles) ? input.existingTitles.map((title) => String(title).slice(0, 140)) : [])])].filter(Boolean).slice(-250);
      const recentCopyHistory = existingPosts.slice(0, 30).map((post) => ({ title: String(post.title || "").slice(0, 140), caption: String(post.caption || "").slice(0, 420), headline: String(post.headline || "").slice(0, 100), format: String(post.contentFormat || "").slice(0, 60) }));
      try {
        let timeoutId;
        let result;
        try {
          result = await Promise.race([
            env.AI.chat({
          messages: [
            { role: "system", content: `You are a senior social copy editor for an Egyptian business. Captions must include fluent English and Arabic; overlay text and image directions must be English-only. For captions, write the complete English version first, then a complete natural Egyptian Arabic version after a blank line. Keep title, headline, sub, and visualBrief in English only, with no Arabic script. The photo itself must contain no writing, letters, signs, logos, or text. Keep Arabic only in the caption Arabic section. Keep grammar, spelling, and meaning natural in both languages. Produce polished, publish-ready copy: clear meaning, specific useful detail, one main idea, concise sentences, and a natural call to action only when supported by the supplied business profile. Remove awkward phrasing, repetition, empty slogans, keyword stuffing, and generic AI-sounding openings. Keep each caption coherent and appropriate to its channel; use emojis and hashtags sparingly and only when they fit the brand. Research is inspiration only: synthesize original wording, never copy source wording, make no unsupported business claims, and do not claim search results prove engagement. Public examples can inform format and hook style, but do not infer performance without verifiable metrics. Follow business voice, niche and workflow instructions. Treat client facts as usable claims only when the owner-verified flag is true; otherwise avoid specific business claims and use conservative niche education without inventing details. ${String(workflow.stepInstructions?.writer || "").slice(0, 1800)} Create distinct concepts with varied formats, hooks, stories, and audiences. Never repeat a previous post or create a near-duplicate in this batch: compare the idea, hook, argument, and call to action, even when wording differs. Each concept must deliver a different useful angle for this exact niche. Make hooks curiosity-led and thumb-stopping without deceptive clickbait; make both the copy and visual idea memorable. The visual brief must describe a photograph matching the exact product, service or place in an authentic Egyptian context when relevant, with no writing or graphic text inside the image. Preserve the supplied brand name exactly when used. Return JSON {"posts":[{"title":string,"caption":string,"headline":string,"sub":string,"visualBrief":string,"format":string,"channel":string}]} with exactly ${count} posts.` },
            { role: "user", content: `Business: ${business.name}\nProfile facts verified by owner: ${business.businessProfile?.verified === true ? 'yes' : 'no; do not assert profile claims as facts'}\nOfficial website: ${business.websiteUrl || 'not supplied'}\nVerified business description: ${business.businessProfile?.verified === true ? business.businessProfile?.verifiedDescription || business.description || '' : 'not verified'}\nProducts/services: ${business.businessProfile?.verified === true ? business.businessProfile?.offer || '' : 'not verified'}\nBrand colors: ${JSON.stringify(business.websiteInsights?.colors || [])}\nPrimary niche: ${classification.category}\nSub-niche: ${classification.subNiche}\nBusiness type: ${classification.businessType}\nLikely customer: ${classification.likelyCustomer}\nAudience: ${business.businessProfile?.audience || business.audience || ""}\nOffer: ${business.businessProfile?.offer || ""}\nDifferentiator: ${business.businessProfile?.differentiator || ""}\nGoal: ${business.businessProfile?.goal || ""}\nCTA: ${business.businessProfile?.callToAction || ""}\nVoice: ${business.businessProfile?.brandVoice || business.tone || ""}\nService area: ${business.businessProfile?.serviceArea || "Egypt"}\nRestrictions: ${business.businessProfile?.restrictions || business.businessProfile?.regulatoryNotes || ""}\nDescription: ${business.description || ""}\nChannels: ${(workflow.channels || business.channels || []).join(", ")}\nWorkflow instructions: ${String(workflow.instructions || "Create original, platform-native campaign posts.").slice(0, 3000)}\nResearch bot instructions: ${String(workflow.stepInstructions?.scout || "Find public examples from the same business niche and location.").slice(0, 1800)}\nFormat mix: ${workflow.contentMix || "educational, product or service spotlight, behind the scenes, social proof, community, offer"}\nNew post count: ${count}\nAvoid repeating these campaign titles: ${existingTitles.slice(0, 100).join(" | ")}\nRecent campaign content to avoid duplicating (titles, captions, headlines, formats): ${JSON.stringify(recentCopyHistory).slice(0, 12000)}\nCurrent public web research snippets (use only as factual context, keep claims conservative):\n${sourceContext || "No searchable snippets were available. Use only supplied business facts and general content strategy."}` },
          ],
          json: true,
            }),
            new Promise((_, reject) => { timeoutId = setTimeout(() => reject(new Error("Copy generation exceeded its time limit.")), 18000); }),
          ]);
        } finally {
          clearTimeout(timeoutId);
        }
        const parsed = JSON.parse(result.content || "{}");
        const generated = Array.isArray(parsed.posts) ? parsed.posts : [];
        if (!generated.length) throw new Error("The writing bot returned no post concepts.");
        const completePosts = [];
        let duplicateReplacements = 0;
        const fallbackWarning = () => {
          const fallback = fallbackCopyPosts(business, classification, 1,
            [...existingTitles, ...completePosts.map((post) => post.title || "")], [...existingPosts, ...completePosts])[0];
          if (isDuplicatePost(fallback, [...existingPosts, ...completePosts])) throw new Error("A unique fallback draft could not be created.");
          return fallback;
        };
        for (const draft of generated.slice(0, count)) {
          if (isDuplicatePost(draft, [...existingPosts, ...completePosts])) {
            completePosts.push(fallbackWarning());
            duplicateReplacements++;
          } else completePosts.push(draft);
        }
        const partial = completePosts.length < count;
        while (completePosts.length < count) completePosts.push(fallbackWarning());
        const generationWarning = partial || duplicateReplacements
          ? `${partial ? "The writing bot returned an incomplete batch" : "Repeated concepts were replaced"}; template drafts need owner review.`
          : undefined;
        return json({ posts: completePosts, sources, researchStatus: sources.length ? "web-researched" : "no-web-results", generationWarning, duplicateReplacements });
      } catch (error) {
        const warning = "AI copy generation was unavailable; factual template drafts need owner review.";
        let fallback;
        try {
          fallback = fallbackCopyPosts(business, classification, count, existingTitles, existingPosts);
        } catch {
          return json({ error: "A unique replacement could not be created. This draft was blocked to prevent duplicate content." }, 409);
        }
        if (fallback.some((post, index) => isDuplicatePost(post, [...existingPosts, ...fallback.slice(0, index)]))) return json({ error: "A unique replacement could not be created. This draft was blocked to prevent duplicate content." }, 409);
        return json({ posts: fallback, sources, researchStatus: sources.length ? "web-researched" : "no-web-results", generationWarning: `${warning} (${String(error?.message || error).slice(0, 120)})` });
      }
    }

    if (path === "/api/crm/direct-art" && request.method === "POST") {
      const denied = requireOwner();
      if (denied) return denied;
      const input = await body() || {};
      const state = await read();
      if (!state) return json({ error: "Workspace is not initialized." }, 409);
      const business = state.businesses.find((item) => item.id === input.businessId);
      if (!business) return json({ error: "Business not found." }, 404);
      const drafts = Array.isArray(input.posts) ? input.posts.slice(0, 10).map((post) => ({ id: String(post.id || "").slice(0, 140), title: String(post.title || "").slice(0, 140), format: String(post.format || "").slice(0, 80), visualBrief: String(post.visualBrief || "").slice(0, 700) })) : [];
      if (!drafts.length || drafts.some((post) => !post.id)) return json({ error: "The art director needs drafts with stable IDs." }, 400);
      const classification = imageContext(input, business);
      const priorConcepts = state.posts.filter((post) => post.businessId === input.businessId && !drafts.some((draft) => draft.id === post.id)).slice(0, 30).map((post) => ({ title: String(post.title || "").slice(0, 100), visualBrief: String(post.visualBrief || post.visualReview?.notes || "").slice(0, 180), movement: post.adjustments?.movement || "" }));
      const references = (Array.isArray(input.sources) ? input.sources : []).slice(0, 6).map((source) => ({ platform: String(source.platform || "Public source").slice(0, 30), title: String(source.title || "").slice(0, 140), snippet: String(source.snippet || "").slice(0, 240), url: String(source.url || "").startsWith("https://") ? String(source.url).slice(0, 400) : "" })).filter((source) => source.url);
      try {
        const result = await env.AI.chat({ messages: [
          { role: "system", content: `You are a commercial art director for an Egyptian business. Treat client-specific product and service details as factual only when the profile is owner-verified; otherwise follow the niche brief without inventing client claims. Respect the provided brand palette, but never invent or render the business logo. Act as the campaign visual director and engineer. Create a distinct, photorealistic, attention-catching photography brief for every draft. Ensure each scene, story, subject arrangement, camera angle, lighting, and color impression differs both within this batch and from the prior visual concepts. Match the exact product, service, property, people, equipment or experience in its niche. Use plausible Egyptian context and the stated service area where it helps. Public examples are visual inspiration only: do not copy a scene, brand, wording, logo, or identifiable people. The photo must contain no readable writing, letters, numbers, logos, UI copy, signs, labels, or watermarks. If a screen, sign, package or document is essential, specify a blank, abstract, or out-of-focus surface. Campaign text will be typeset over the photo by the app. Apply these owner art-direction rules: ${String(input.instructions || "").slice(0, 1800)} Return JSON {"posts":[{"id":string,"visualBrief":string}]} with exactly ${drafts.length} posts in the same order.` },
          { role: "user", content: `Business: ${business.name}\nProfile facts verified by owner: ${business.businessProfile?.verified === true ? 'yes' : 'no'}\nVerified description: ${business.businessProfile?.verified === true ? business.businessProfile?.verifiedDescription || '' : 'not verified'}\nProducts/services: ${business.businessProfile?.verified === true ? business.businessProfile?.offer || '' : 'not verified'}\nBrand colors: ${JSON.stringify(business.websiteInsights?.colors || [])}\nNiche: ${classification.category} / ${classification.subNiche}\nBusiness type: ${classification.businessType}\nService area: ${classification.serviceArea}\nPhotography style: ${classification.photographyStyle}\nBrand direction: ${classification.brandVisualDirection}\nPublic visual references: ${JSON.stringify(references).slice(0, 3000)}\nRecent visual concepts to avoid: ${JSON.stringify(priorConcepts).slice(0, 7000)}\nDraft concepts: ${JSON.stringify(drafts)}` },
        ], json: true });
        const parsed = JSON.parse(result.content || "{}");
        if (!Array.isArray(parsed.posts)) throw new Error("The art director returned an invalid response.");
        const draftIds = new Set(drafts.map((draft) => draft.id));
        const returnedIds = parsed.posts.map((directed) => String(directed?.id || ""));
        const directedById = new Map();
        const directedByPosition = new Map();
        parsed.posts.forEach((directed, index) => {
          const id = returnedIds[index];
          if (draftIds.has(id) && !directedById.has(id)) directedById.set(id, directed);
          else if (!id) directedByPosition.set(index, directed);
        });
        // Restore submitted order from stable IDs, and leave the writer's
        // original brief in place for omitted or unidentifiable responses.
        const posts = drafts.map((draft, index) => {
          const directed = directedById.get(draft.id) || directedByPosition.get(index);
          const fallbackBrief = draft.visualBrief || `Create a photorealistic image of ${draft.title || business.name} in a plausible ${classification.serviceArea || "Egyptian"} setting, with no text, logos, or watermarks.`;
          return { id: draft.id, visualBrief: String(directed?.visualBrief || "").slice(0, 900) || fallbackBrief };
        });
        return json({ posts, directed: directedById.size });
      } catch (error) {
        return json({ error: "Art direction failed: " + String(error?.message || error).slice(0, 200) }, 503);
      }
    }

    if (path === "/api/crm/review-copy" && request.method === "POST") {
      const denied = requireOwner();
      if (denied) return denied;
      const input = await body() || {};
      const state = await read(false);
      if (!state) return json({ error: "Workspace is not initialized." }, 409);
      const business = state.businesses.find((item) => item.id === input.businessId);
      if (!business) return json({ error: "Business not found." }, 404);
      const posts = Array.isArray(input.posts) ? input.posts.slice(0, 10) : [];
      if (!posts.length) return json({ error: "No draft copy was provided for review." }, 400);
      const history = (await storedPosts(env, userId, state)).filter((post) => post.businessId === input.businessId);
      const suppliedHistory = Array.isArray(input.existingPosts) ? input.existingPosts.filter((post) => post?.businessId === input.businessId) : [];
      const historyPosts = [...new Map([...history, ...suppliedHistory].filter((post) => post.id).map((post) => [String(post.id), post])).values()];
      const safeHistory = historyPosts.slice(0, 30).map((post) => ({ title: String(post.title || "").slice(0, 140), caption: String(post.caption || "").slice(0, 350), headline: String(post.headline || "").slice(0, 90) }));
      const safePosts = posts.map((post) => ({
        title: String(post.title || "").slice(0, 140), caption: String(post.caption || "").slice(0, 2400),
        headline: String(post.headline || "").slice(0, 120), sub: String(post.sub || "").slice(0, 200),
        visualBrief: String(post.visualBrief || "").slice(0, 600), format: String(post.format || "").slice(0, 80),
      }));
      const publicReferences = (Array.isArray(input.sources) ? input.sources : []).slice(0, 12).map((source) => ({
        title: String(source.title || "").slice(0, 180), snippet: String(source.snippet || "").slice(0, 320),
        url: String(source.url || "").startsWith("https://") ? String(source.url).slice(0, 500) : "",
        platform: String(source.platform || "public web").slice(0, 40), kind: String(source.kind || "reference").slice(0, 40),
      })).filter((source) => source.url);
      try {
        const result = await env.AI.chat({
          messages: [
            { role: "system", content: `You are the final copy editor for an Egyptian business campaign. Treat client-specific business facts as usable only when the profile verification flag is true; otherwise remove unverified claims and do not invent offers, features, or differentiators. Keep the full English caption first and the full Egyptian Arabic caption second, separated by a blank line. Keep title, headline, sub, and visualBrief English-only with no Arabic script. Preserve both languages in caption only. Photo overlays and photo directions must not contain Arabic writing or text. Compare every post with all other drafts and the supplied prior campaign history. Detect repeated core idea, hook, argument, examples, and call to action, including paraphrases and translations. Rewrite any duplicate into a clearly different, useful niche angle. Treat originality as a required pass condition. Carefully proofread and improve every draft. Fix grammar, punctuation, translation artifacts, unclear references, awkward word choices, and repetitive or generic phrasing. Make the idea immediately understandable and useful to the audience; keep captions concise, channel-appropriate, and faithful to the supplied brand voice. Keep headlines short, natural, and correctly spelled. Remove unsupported factual or medical/financial/legal claims and rewrite original wording; never copy a source. Preserve the exact niche and visual subject. Do not add facts, offers, features, guarantees, or brand details the business did not supply. Apply these owner-configured rules: ${String(input.instructions || "").slice(0, 1800)} Return JSON {"posts":[{"title":string,"caption":string,"headline":string,"sub":string,"visualBrief":string,"format":string,"reviewNote":string}]} with exactly ${safePosts.length} drafts in the same order.` },
            { role: "user", content: `Business: ${business.name}\nProfile facts verified by owner: ${business.businessProfile?.verified === true ? 'yes' : 'no'}\nOfficial website: ${business.websiteUrl || 'not supplied'}\nVerified description: ${business.businessProfile?.verified === true ? business.businessProfile?.verifiedDescription || '' : 'not verified'}\nIndustry: ${business.industry}\nNiche: ${input.classification?.category || business.industry} / ${input.classification?.subNiche || business.industry}\nDescription: ${business.description || ""}\nServices and offer: ${business.businessProfile?.offer || ""}\nAudience: ${business.businessProfile?.audience || business.audience || ""}\nTone: ${business.businessProfile?.brandVoice || business.tone || ""}\nRestrictions: ${business.businessProfile?.restrictions || business.businessProfile?.regulatoryNotes || "None supplied"}\nChannels: ${(input.channels || business.channels || []).join(", ")}\nOwner-configured public research context: ${JSON.stringify(publicReferences).slice(0, 6500)}\nRecent business campaign history to avoid duplicating: ${JSON.stringify(safeHistory).slice(0, 10000)}\nDraft batch: ${JSON.stringify(safePosts).slice(0, 18000)}` },
          ], json: true,
        });
        const parsed = JSON.parse(result.content || "{}");
        if (!Array.isArray(parsed.posts) || parsed.posts.length !== safePosts.length) throw new Error("The reviewer returned an incomplete batch.");
        const duplicateReviewedIndexes = [];
        const acceptedReviews = [];
        parsed.posts.forEach((reviewedPost, index) => {
          if (isDuplicatePost(reviewedPost, [...historyPosts, ...acceptedReviews])) duplicateReviewedIndexes.push(index);
          else acceptedReviews.push(reviewedPost);
        });
        if (duplicateReviewedIndexes.length) return json({ posts: parsed.posts, reviewed: false, duplicateCount: duplicateReviewedIndexes.length, error: "Engineer blocked repeated post concepts; original drafts remain unapproved." });
        return json({ posts: parsed.posts, reviewed: true });
      } catch (error) {
        return json({ error: "Quality review failed: " + String(error?.message || error).slice(0, 180) }, 503);
      }
    }

    if (path === "/api/crm/search-images" && request.method === "POST") {
      const denied = requireOwner();
      if (denied) return denied;
      const input = await body() || {};
      const state = await read(false);
      if (!state) return json({ error: "Workspace is not initialized." }, 409);
      const used = await usedPhotos(env, userId, state);
      const query = String(input.query || "creative marketing").slice(0, 160);
      const business = state.businesses.find((item) => item.id === input.businessId) || {};
      const classification = imageContext(input, business, query);
      let results = [];
      try {
        results = (await searchOpenverse(classification, 20)).map((item) => ({
            item,
            relevance: photoRelevance(item, classification),
        })).filter((entry) => entry.relevance > 0).sort((a, b) => b.relevance - a.relevance).map(({ item, relevance }) => ({ id: item.id, title: item.title || "Photograph", creator: item.creator || "Unknown creator", url: item.url, originalUrl: item.url, provider: "Openverse", license: String(item.license || "License details unavailable").toUpperCase(), commercialUse: true, relevance, pageUrl: item.foreign_landing_url || item.url, licenseUrl: item.license_url || "https://openverse.org/", foreign_landing_url: item.foreign_landing_url || item.url }));
      } catch {}
      results = results.filter((item) => !used.keys.has(photoKey(item.url)) && !used.sources.has(String(item.id || "")));
      return json({ results, query, classification, sources: [{ name: "Commercial-use photography", status: results.length ? "found" : "no-match", count: results.length }] });
    }

    if (path === "/api/crm/reserve-photo" && request.method === "POST") {
      const denied = requireOwner();
      if (denied) return denied;
      const input = await body() || {};
      const imageUrl = String(input.url || "");
      if (!imageUrl.startsWith("https://")) return json({ error: "Invalid photo URL." }, 400);
      const state = await read(false);
      if (!state) return json({ error: "Workspace is not initialized." }, 409);
      const used = await usedPhotos(env, userId, state);
      const key = photoKey(imageUrl);
      const sourceId = String(input.sourceId || key);
      if (used.keys.has(key) || used.sources.has(sourceId)) return json({ error: "This photo is already used. Choose a fresh image." }, 409);
      if (!(await reservePhoto(env, userId, imageUrl, sourceId, input.title))) return json({ error: "This photo was just claimed elsewhere. Choose another." }, 409);
      teachPhotoUniqueness(state);
      await saveState(env, userId, state, false);
      return json({ ok: true });
    }

    if (path === "/api/crm/proxy-image" && request.method === "GET") {
      if (!userId) return new Response("Sign in as the project owner to export images", { status: 401 });
      const target = url.searchParams.get("url");
      let parsed;
      try { parsed = new URL(target); } catch { return new Response("Invalid image URL", { status: 400 }); }
      if (parsed.protocol !== "https:") return new Response("Only HTTPS image sources can be exported", { status: 400 });
      const key = photoKey(parsed.toString());
      const usage = await env.DB.prepare("SELECT photo_key FROM crm_photo_usage WHERE user_id = ? AND photo_key = ?").bind(userId, key).first();
      if (!usage) return new Response("Image is not part of this workspace", { status: 403 });
      try {
        const upstream = await fetch(parsed.toString(), { signal: AbortSignal.timeout(7000) });
        const type = upstream.headers.get("content-type") || "";
        if (!upstream.ok || !type.startsWith("image/")) return new Response("Image unavailable", { status: 502 });
        const bytes = await upstream.arrayBuffer();
        if (bytes.byteLength > 10 * 1024 * 1024) return new Response("Image too large", { status: 413 });
        return new Response(bytes, { headers: { "Content-Type": type, "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=86400" } });
      } catch { return new Response("Image fetch failed", { status: 502 }); }
    }

    if (path === "/api/crm/sync" && request.method === "POST") {
      const denied = requireOwner();
      if (denied) return denied;
      const input = await body();
      if (!input || typeof input !== "object") return json({ error: "Invalid update." }, 400);
      const state = await read(Array.isArray(input.posts));
      if (!state) return json({ error: "Workspace has not been initialized." }, 409);
      for (const key of ["businesses", "posts", "workflows"]) if (Array.isArray(input[key])) state[key] = input[key];
      await saveState(env, userId, state, Array.isArray(input.posts));
      return json({ ok: true });
    }

    if (path === "/api/crm/generate-photo" && request.method === "POST") {
      const denied = requireOwner();
      if (denied) return denied;
      const input = await body() || {};
      const state = await read(false);
      if (!state) return json({ error: "Workspace is not initialized." }, 409);
      const business = state.businesses.find((item) => item.id === input.businessId) || { name: "Brand", industry: "Creative", description: "" };
      const brief = String(input.brief || business.description || "Brand campaign").slice(0, 400);
      const classification = imageContext(input, business, brief);
      const used = await usedPhotos(env, userId, state);
      teachPhotoUniqueness(state);
      const previous = used.titles.slice(-24).join("; ");
      try {
        const result = await env.AI.generateImage({ prompt: nicheImagePrompt({ classification, business, brief, previous, purpose: "commercial editorial" }), aspectRatio: ["1:1", "3:4", "4:3", "9:16", "16:9"].includes(input.aspectRatio) ? input.aspectRatio : "1:1" });
        if (!result?.url) return json({ error: "Image generation returned no image." }, 503);
        const sourceId = makeId("ai-photo");
        const key = photoKey(result.url);
        if (used.keys.has(key) || !(await reservePhoto(env, userId, result.url, sourceId, brief))) return json({ error: "The generated image matched a previously used photo. Try again for a fresh variation." }, 409);
        await saveState(env, userId, state, false);
        return json({ assetId: sourceId, url: result.url, source: { type: "ai", id: sourceId, provider: "Websim AI", title: brief, license: "AI-generated" } });
      } catch { return json({ error: "Image generation is temporarily unavailable. Please try again." }, 503); }
    }

    if (path === "/api/crm/adjust-photos" && request.method === "POST") {
      const denied = requireOwner();
      if (denied) return denied;
      const input = await body() || {};
      const state = await read();
      if (!state) return json({ error: "Workspace is not initialized." }, 409);
      const postIds = Array.isArray(input.postIds) ? [...new Set(input.postIds.map((id) => String(id).slice(0, 140)))].slice(0, 10) : [];
      const posts = postIds.map((id) => state.posts.find((post) => post.id === id)).filter((post) => post && post.businessId === input.businessId);
      if (!posts.length || posts.length !== postIds.length) return json({ error: "The editor batch has missing or mismatched drafts." }, 400);
      const business = state.businesses.find((item) => item.id === input.businessId);
      if (!business) return json({ error: "Business not found." }, 404);
      const safePosts = posts.map((post) => ({ id: post.id, title: String(post.title || "").slice(0, 140), platform: String(post.platform || "").slice(0, 30), format: String(post.contentFormat || "").slice(0, 60), visualBrief: String(post.visualBrief || post.visualReview?.notes || "").slice(0, 500), imageUrl: String(post.imageUrl || ""), adjustments: post.adjustments || {} }));
      const usedDesignSignatures = state.posts.filter((post) => post.businessId === business.id && !postIds.includes(post.id)).map((post) => `${post.adjustments?.movement || "editorial"}/${post.adjustments?.aspectRatio || "1:1"}/${post.adjustments?.overlayStyle || "classic"}/${post.designFont || ""}`);
      const previousDesigns = usedDesignSignatures.slice(0, 80);
      try {
        const visualAuditContent = [{ type: "text", text: `Business: ${business.name}\nIndustry: ${business.industry}\nBrand colors: ${JSON.stringify(business.websiteInsights?.colors || [])}\nPreviously used design signatures (do not repeat when another option exists): ${previousDesigns.join(" | ")}\nDrafts and visual briefs: ${JSON.stringify(safePosts.map(({ imageUrl, ...post }) => post))}` }];
        for (const post of safePosts) {
          visualAuditContent.push({ type: "text", text: `Engineer photo audit, post ${post.id}: compare this actual image against its exact niche and photo brief. Rate fit, legibility, authenticity, obvious watermark or embedded text, and distinctiveness.` });
          if (post.imageUrl.startsWith("https://")) visualAuditContent.push({ type: "image_url", image_url: { url: post.imageUrl } });
        }
        const result = await env.AI.chat({ messages: [
          { role: "system", content: `You are the engineer's final visual quality reviewer and editorial layout designer. Inspect every supplied actual photo. A photo passes only if it clearly fits that post's exact business niche and brief, looks usable and authentic, contains no visible text/logos/watermarks, and is distinct from the other photos. Set visualIssues to an empty string when all checks pass. Give each photo a visualScore from 0 to 10, engineerApproved true only when score is at least 8 and every check passes, and precise visualIssues otherwise. Then choose a catchy but brand-appropriate crop, movement, contrast, and overlay setting. Make every new design signature distinct from previous signatures and each other whenever a valid option exists. Never invent claims or add text into photos. Owner editor rules: ${String(input.instructions || "").slice(0, 1800)} Return JSON {"posts":[{"id":string,"brightness":number,"contrast":number,"saturation":number,"warmth":number,"vignette":number,"aspectRatio":"1:1"|"4:5"|"9:16"|"16:9","movement":string,"overlayStyle":string,"recommendedFont":string,"editorNote":string,"visualScore":number,"engineerApproved":boolean,"visualIssues":string}]} with exactly ${posts.length} posts.` },
          { role: "user", content: visualAuditContent },
        ], json: true });
        const parsed = JSON.parse(result.content || "{}");
        if (!Array.isArray(parsed.posts) || parsed.posts.length !== posts.length) throw new Error("The visual editor returned an incomplete batch.");
        const updatedPosts = [];
        const designSignatures = new Set(usedDesignSignatures);
        const movementOptions = ["editorial", "minimalist", "brutalism", "glassmorphism", "claymorphism", "retro-y2k", "bento"];
        const ratioOptions = ["1:1", "4:5", "9:16", "16:9"];
        const overlayOptions = ["classic", "quiet", "bold-badge", "split", "minimal"];
        const fontOptions = ["DM Serif Display", "Playfair Display", "Outfit", "Montserrat", "Lora", "Space Grotesk"];
        for (const draft of parsed.posts) {
          const post = posts.find((item) => item.id === String(draft.id));
          if (!post) throw new Error("The visual editor returned a mismatched draft ID.");
          const clamp = (value, min, max, fallback) => Math.max(min, Math.min(max, Number.isFinite(Number(value)) ? Number(value) : fallback));
          let aspectRatio = ["1:1", "4:5", "9:16", "16:9"].includes(draft.aspectRatio) ? draft.aspectRatio : "1:1";
          let movement = ["editorial", "minimalist", "brutalism", "glassmorphism", "claymorphism", "retro-y2k", "bento"].includes(draft.movement) ? draft.movement : "editorial";
          let overlayStyle = ["classic", "quiet", "bold-badge", "split", "minimal"].includes(draft.overlayStyle) ? draft.overlayStyle : "classic";
          let designFont = String(draft.recommendedFont || post.designFont || "DM Serif Display").slice(0, 80);
          let signature = `${movement}/${aspectRatio}/${overlayStyle}/${designFont}`;
          let uniqueSignature = !designSignatures.has(signature);
          if (designSignatures.has(signature)) {
            outer: for (const candidateFont of fontOptions) for (const candidateMovement of movementOptions) for (const candidateRatio of ratioOptions) for (const candidateOverlay of overlayOptions) {
              const candidate = `${candidateMovement}/${candidateRatio}/${candidateOverlay}/${candidateFont}`;
              if (!designSignatures.has(candidate)) { movement = candidateMovement; aspectRatio = candidateRatio; overlayStyle = candidateOverlay; designFont = candidateFont; signature = candidate; uniqueSignature = true; break outer; }
            }
          }
          if (!uniqueSignature) throw new Error("No unused photo layout remains for this campaign. The engineer blocked a repeated design.");
          designSignatures.add(signature);
          post.adjustments = { brightness: clamp(draft.brightness, 80, 140, 100), contrast: clamp(draft.contrast, 80, 150, 102), saturation: clamp(draft.saturation, 50, 160, 104), warmth: clamp(draft.warmth, -30, 30, 4), vignette: clamp(draft.vignette, 0, 60, 12), aspectRatio, movement, overlayStyle };
          post.designFont = designFont;
          const note = String(draft.editorNote || "Photo layout settings prepared for artwork export.").slice(0, 240);
          post.visualReview = { ...(post.visualReview || { approved: false, score: 0, notes: "", revisionDirection: "" }), notes: `${post.visualReview?.notes || ""} Visual editor: ${note}`.trim(), revisionDirection: post.visualReview?.revisionDirection || "Owner review and download approval are pending." };
          const visualScore = clamp(draft.visualScore, 0, 10, 0);
          const visuallyApproved = !!post.imageUrl && draft.engineerApproved === true && visualScore >= 8 && !String(draft.visualIssues || "").trim();
          const visualNote = visuallyApproved ? `Visual QA passed (${visualScore}/10).` : String(draft.visualIssues || "Visual review did not meet the required 8/10 pass score, or the photo is missing.");
          post.engineerReview = { ...(post.engineerReview || { content: "needs_attention", visual: "pending", notes: [] }), visual: visuallyApproved ? "approved" : "needs_attention", notes: [...(post.engineerReview?.notes || []).filter((item) => !String(item).startsWith("Visual QA")), visualNote] };
          if (!post.researchSources?.length) post.status = "Research needed";
          else if (post.engineerReview.content !== "approved") post.status = "Engineer copy review needed";
          else if (!visuallyApproved) post.status = post.imageUrl ? "Engineer visual review needed" : "Photo needed";
          else post.status = "Ready for owner review";
          updatedPosts.push(post);
        }
        state.learning = state.learning || [];
        state.learning.unshift({ id: makeId("learn"), bot_id: "editor", business_id: business.id, kind: "batch_photo_adjustment", note: `Prepared editable layout settings for ${updatedPosts.length} ${business.industry} campaign drafts.`, source: "visual_editor", created_at: new Date().toISOString() });
        await saveState(env, userId, state);
        return json({ posts: updatedPosts, edited: updatedPosts.length, visualApproved: updatedPosts.filter((post) => post.engineerReview?.visual === "approved").length });
      } catch (error) {
        return json({ error: "Visual editor failed: " + String(error?.message || error).slice(0, 200) }, 503);
      }
    }

    if (path === "/api/crm/adjust-photo" && request.method === "POST") {
      const denied = requireOwner();
      if (denied) return denied;
      const input = await body() || {};
      const state = await read();
      const post = state && state.posts.find((item) => item.id === input.postId);
      if (!post) return json({ error: "Post not found." }, 404);
      const adjustments = { ...(post.adjustments || {}), ...(input.adjustments || {}) };
      let feedback = "Visual adjustments saved.";
      if (input.botInstruction) {
        try {
          const result = await env.AI.chat({ messages: [
            { role: "system", content: "You are a photo art director. Return JSON only with brightness (80-140), contrast (80-150), saturation (50-160), warmth (-30-30), vignette (0-60), aspectRatio (1:1, 4:5, 9:16, or 16:9), movement, overlayStyle, recommendedFont, and editorNote." },
            { role: "user", content: "Adjust " + String(post.title).slice(0, 160) + ". Direction: " + String(input.botInstruction).slice(0, 300) + ". Current settings: " + JSON.stringify(adjustments) },
          ], json: true });
          const parsed = JSON.parse(result.content || "{}");
          for (const key of ["brightness", "contrast", "saturation", "warmth", "vignette", "aspectRatio", "movement", "overlayStyle"]) if (parsed[key] !== undefined) adjustments[key] = parsed[key];
          if (parsed.recommendedFont) post.designFont = String(parsed.recommendedFont).slice(0, 80);
          feedback = String(parsed.editorNote || feedback).slice(0, 240);
        } catch {
          const command = String(input.botInstruction).toLowerCase();
          if (command.includes("warm") || command.includes("golden")) adjustments.warmth = 18;
          if (command.includes("moody") || command.includes("dark")) adjustments.brightness = 92;
          if (command.includes("vibrant") || command.includes("pop")) adjustments.saturation = 130;
          feedback = "Applied a visual preset based on your direction.";
        }
      }
      post.adjustments = adjustments;
      state.learning = state.learning || [];
      state.learning.unshift({ id: makeId("learn"), bot_id: "editor", business_id: post.businessId, kind: "photo_adjustment", note: "Adjusted " + post.title + ": " + feedback, source: "visual_editor", created_at: new Date().toISOString() });
      await saveState(env, userId, state);
      return json({ ok: true, post, adjustments, feedback });
    }

    if (path === "/api/crm/post-image" && request.method === "POST") {
      const denied = requireOwner();
      if (denied) return denied;
      const contentId = request.headers.get("x-content-id");
      const type = request.headers.get("content-type") || "";
      if (!["image/jpeg", "image/png", "image/webp"].includes(type)) return json({ error: "Upload a JPEG, PNG, or WebP image." }, 400);
      const bytes = await request.arrayBuffer();
      if (!bytes.byteLength || bytes.byteLength > 5 * 1024 * 1024) return json({ error: "Image must be under 5 MB." }, 413);
      const state = await read();
      const post = state && state.posts.find((item) => item.id === contentId);
      if (!post) return json({ error: "Post not found." }, 404);
      try {
        const saved = await env.BLOB.put("photo-" + makeId("upload"), bytes, { contentType: type });
        post.imageUrl = saved.url;
        post.imageApproved = true;
        post.imageSource = { type: "upload", title: post.title, license: "Owner upload" };
        await reservePhoto(env, userId, saved.url, makeId("upload-photo"), post.title);
        post.visualReview = { approved: true, score: 10, notes: "Owner supplied replacement photo.", revisionDirection: "" };
        await saveState(env, userId, state);
        return json({ ok: true, assetId: makeId("asset"), url: saved.url, approved: true });
      } catch { return json({ error: "Could not store this image." }, 503); }
    }

    if (path === "/api/crm/bot-task" && request.method === "GET") {
      const denied = requireOwner();
      if (denied) return denied;
      const state = await read(false);
      const task = state?.botTasks?.find((item) => item.id === url.searchParams.get("id"));
      return task ? json({ task }) : json({ error: "Task not found." }, 404);
    }

    if (path === "/api/crm/bot-task" && request.method === "POST") {
      const denied = requireOwner();
      if (denied) return denied;
      const input = await body();
      const state = await read(false);
      if (!input || !state || !input.businessId || !input.botId || !String(input.title || "").trim() || !String(input.instructions || "").trim()) return json({ error: "Invalid task." }, 400);
      if (!state.businesses.some((business) => business.id === input.businessId)) return json({ error: "Business not found." }, 404);
      const task = { ...input, ownerId: userId, status: "queued", progress: 0, createdAt: input.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
      state.botTasks = state.botTasks || [];
      state.botTasks.unshift(task);
      await saveState(env, userId, state, false);
      return json({ task }, 201);
    }

    if (path === "/api/crm/bot-task-update" && request.method === "POST") {
      const denied = requireOwner();
      if (denied) return denied;
      const input = await body() || {};
      const state = await read(false);
      const task = state && state.botTasks.find((item) => item.id === input.id);
      if (!task) return json({ error: "Task not found." }, 404);
      normalizeLegacyTask(task);
      const transitions = {
        queued: ["preparing", "cancelled"],
        preparing: ["running", "failed"],
        running: ["partially_completed", "completed", "failed"],
        partially_completed: ["preparing", "completed", "queued"],
        completed: ["preparing", "queued"],
        failed: ["preparing", "queued"],
        cancelled: ["queued"],
      };
      const previousStatus = task.status;
      const nextStatus = input.status || task.status;
      if (input.reviewStatus !== undefined && !["pending", "approved"].includes(input.reviewStatus)) return json({ error: "Invalid review status." }, 400);
      if (!Object.hasOwn(transitions, nextStatus)) return json({ error: "Unsupported job status." }, 400);
      if (nextStatus !== task.status && !transitions[task.status]?.includes(nextStatus)) {
        return json({ error: `Invalid job transition: ${task.status} to ${nextStatus}.` }, 409);
      }
      if (nextStatus === "cancelled" && task.status !== "queued") {
        return json({ error: "Only queued jobs can be cancelled; active bot requests cannot be reliably stopped." }, 409);
      }
      if (["completed", "partially_completed"].includes(nextStatus) && input.status !== task.status && !input.result && !task.result) {
        return json({ error: "A completed job must include its generated result." }, 400);
      }
      const now = new Date().toISOString();
      if (nextStatus === "queued") {
        task.startedAt = null;
        task.completedAt = null;
        task.result = "";
        task.modelInfo = undefined;
        task.reviewStatus = "pending";
      }
      if (nextStatus === "preparing") {
        task.startedAt = now;
        task.completedAt = null;
        task.result = "";
        task.modelInfo = undefined;
        task.reviewStatus = "pending";
      }
      if (["completed", "partially_completed", "failed", "cancelled"].includes(nextStatus) && task.startedAt) {
        task.elapsedMs = (Number(task.elapsedMs) || 0) + Math.max(0, Date.now() - Date.parse(task.startedAt));
        task.startedAt = null;
      }
      task.status = nextStatus;
      task.updatedAt = now;
      if (nextStatus !== previousStatus && ["completed", "partially_completed", "failed", "cancelled"].includes(nextStatus)) task.completedAt = now;
      if (nextStatus === "completed") task.progress = 100;
      for (const key of ["result", "engineerNote", "progress", "activeStep", "reviewStatus", "modelInfo"]) {
        if (input[key] !== undefined) task[key] = input[key];
      }
      if (task.progress !== undefined) task.progress = Math.max(0, Math.min(100, Number(task.progress) || 0));
      await saveState(env, userId, state, false);
      return json({ task });
    }

    if (path === "/api/crm/team-chat" && request.method === "POST") {
      const denied = requireOwner();
      if (denied) return denied;
      const input = await body() || {};
      const state = await read(false);
      if (!state) return json({ error: "Workspace is not initialized." }, 409);
      const business = state.businesses.find((item) => item.id === input.businessId) || state.businesses[0];
      if (!business) return json({ error: "Business not found." }, 404);
      const question = String(input.content || "").trim().slice(0, 1500);
      if (!question) return json({ error: "Message is empty." }, 400);
      const jobTask = input.taskId ? state.botTasks?.find((item) => item.id === input.taskId) : null;
      if (input.taskId && !jobTask) return json({ error: "Task not found." }, 404);
      if (jobTask) {
        normalizeLegacyTask(jobTask);
        if (jobTask.businessId !== business.id) return json({ error: "Task business does not match the request." }, 400);
        if (!["queued", "failed", "completed", "partially_completed"].includes(jobTask.status)) return json({ error: `Job cannot run from ${jobTask.status}.` }, 409);
        const now = new Date().toISOString();
        jobTask.status = "preparing";
        jobTask.progress = 5;
        jobTask.activeStep = "Preparing business context and bot instructions";
        jobTask.startedAt = now;
        jobTask.completedAt = null;
        jobTask.result = "";
        jobTask.modelInfo = undefined;
        jobTask.reviewStatus = "pending";
        jobTask.updatedAt = now;
        await saveState(env, userId, state, false);
      }
      const names = { lead: "Team Lead", scout: "Asset Scout", artist: "Art Director", editor: "Visual Editor", writer: "Content Creator", publisher: "Publishing Assistant" };
      const responsibilities = {
        lead: "Audit niche fit, brand accuracy, originality, and supplied restrictions. Identify missing facts instead of guessing.",
        scout: "Recommend search queries and photo subjects that match the exact product or service, Egyptian location, and commercial license needs. Never suggest reusing an asset.",
        artist: "Turn the brand profile into concrete lighting, composition, setting, color, and product-specific photo direction. Keep Egyptian context authentic.",
        editor: "Give actionable crop, brightness, contrast, warmth, typography, and overlay settings. Keep the displayed business name exactly as entered.",
        writer: "Write original, channel-aware copy for the selected niche. Use supplied offers, audience, tone, CTA, and restrictions; do not copy web sources or invent claims.",
        publisher: "Prepare a clean review and export checklist. Never say a post was published or scheduled unless the platform confirms it.",
      };
      let answer = "I can help refine campaign copy, photo direction, and review settings for this brand.";
      let modelInfo;
      let partialResult = false;
      const references = await researchContent(business, imageContext({ query: question }, business, question)).catch(() => []);
      if (jobTask) {
        jobTask.status = "running";
        jobTask.progress = 25;
        jobTask.activeStep = "Generating a response with verified business context";
        jobTask.updatedAt = new Date().toISOString();
        await saveState(env, userId, state, false);
      }
      try {
        const result = await env.AI.chat({ messages: [
          { role: "system", content: "You are the " + (names[input.botId] || "Goodfolk CRM assistant") + " for " + business.name + ". Brand tone: " + business.tone + ". Your role: " + (responsibilities[input.botId] || "Give practical, brand-aware help.") + " Business niche: " + business.industry + ". Official website: " + (business.websiteUrl || "not supplied") + ". Profile facts are owner-verified: " + (business.businessProfile?.verified === true ? "yes" : "no; do not assert unverified offers, descriptions, or differentiators as facts") + ". Brand colors: " + JSON.stringify(business.websiteInsights?.colors || []) + ". Logo URL: " + (business.logoUrl || "not supplied") + ". Profile: " + JSON.stringify(business.businessProfile || {}) + ". Use the attached publicly indexed social posts and ad examples when helpful; they are inspiration only, must not be copied, and do not prove performance without explicit metrics. Keep replies concise. Do not claim actions were completed unless the user completed them in the app. Permanent visual rule: never reuse a photo URL or asset ID already used by any campaign. Check learned guidance and photo history; if no fresh image is available, stop rather than falling back to a previous image. Learned guidance: " + (state.learning || []).slice(0, 12).map((item) => item.note).join(" | ") },
          { role: "user", content: `Question: ${question}\nPublic niche references: ${JSON.stringify(references).slice(0, 7000)}` },
        ] });
        answer = String(result.content || answer).slice(0, 3000);
        modelInfo = { provider: result?.provider || result?.modelProvider, model: result?.model || result?.modelId || result?.model_name };
        partialResult = result?.partial === true || result?.status === "partial" || result?.finish_reason === "length";
      } catch (error) {
        if (jobTask) {
          const now = new Date().toISOString();
          const elapsed = Math.max(0, Date.now() - Date.parse(jobTask.startedAt || now));
          jobTask.status = "failed";
          jobTask.startedAt = null;
          jobTask.completedAt = now;
          jobTask.updatedAt = now;
          jobTask.activeStep = "Bot run failed";
          jobTask.engineerNote = String(error?.message || error).slice(0, 240);
          jobTask.elapsedMs = (Number(jobTask.elapsedMs) || 0) + elapsed;
          await saveState(env, userId, state, false);
        }
        return json({ error: "The bot could not finish its response: " + String(error?.message || error).slice(0, 180), references, task: jobTask || undefined }, 503);
      }
      const timestamp = new Date().toISOString();
      const response = { id: makeId("chat"), businessId: business.id, botId: input.botId || "lead", role: "assistant", content: answer, references, ...(modelInfo?.provider || modelInfo?.model ? { modelInfo } : {}), createdAt: timestamp };
      state.chat = state.chat || [];
      state.chat.push({ id: makeId("chat"), businessId: business.id, botId: input.botId || "lead", role: "user", content: question, createdAt: timestamp }, response);
      if (jobTask) {
        const elapsed = Math.max(0, Date.now() - Date.parse(jobTask.startedAt || timestamp));
        jobTask.status = partialResult ? "partially_completed" : "completed";
        jobTask.progress = partialResult ? 75 : 100;
        jobTask.result = `${answer}${references.length ? `\n\nPublic references:\n${references.slice(0, 5).map((source) => `${source.platform || 'Public source'}: ${source.title} — ${source.url}`).join('\n')}` : ''}`;
        jobTask.modelInfo = modelInfo;
        jobTask.reviewStatus = "pending";
        jobTask.startedAt = null;
        jobTask.completedAt = timestamp;
        jobTask.updatedAt = timestamp;
        jobTask.activeStep = partialResult ? "Partial response generated · owner review required" : "Response generated · owner review required";
        jobTask.engineerNote = "Backend job completed; review the result before approving it.";
        jobTask.elapsedMs = (Number(jobTask.elapsedMs) || 0) + elapsed;
      }
      await saveState(env, userId, state, false);
      return json({ message: { ...response, ...(jobTask ? { partial: partialResult } : {}) }, ...(jobTask ? { task: jobTask } : {}) });
    }

    if (path === "/api/crm/photo-rule" && request.method === "POST") {
      const denied = requireOwner();
      if (denied) return denied;
      const state = await read(false);
      if (!state) return json({ error: "Workspace is not initialized." }, 409);
      teachPhotoUniqueness(state);
      await saveState(env, userId, state, false);
      return json({ ok: true, ruleCount: state.learning.filter((item) => item.kind === "photo_uniqueness_rule").length });
    }

    if (path === "/api/crm/campaign" && request.method === "POST") {
      const denied = requireOwner();
      if (denied) return denied;
      const input = await body() || {};
      if (!input.business || !input.post || input.business.id !== "findat" || input.post.businessId !== "findat") return json({ error: "Invalid FIND@ campaign." }, 400);
      const state = await read();
      if (!state) return json({ error: "Workspace is not initialized." }, 409);
      state.businesses = state.businesses || [];
      state.posts = state.posts || [];
      state.workflows = state.workflows || [];
      if (!state.businesses.some((item) => item.id === "findat")) state.businesses.push(input.business);
      const existingPost = state.posts.findIndex((item) => item.id === input.post.id);
      if (existingPost < 0) state.posts.unshift(input.post);
      else state.posts[existingPost] = input.post;
      if (!state.workflows.some((item) => item.businessId === "findat")) state.workflows.unshift(input.workflow);
      await saveState(env, userId, state);
      return json({ ok: true, business: input.business, post: input.post });
    }

    return new Response("Not found", { status: 404 });
  },
};
