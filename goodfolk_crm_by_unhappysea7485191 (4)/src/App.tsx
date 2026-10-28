import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import { useState, useEffect, useRef } from "react";
import { Sidebar } from "./components/Sidebar.tsx";
import { Topbar } from "./components/Topbar.tsx";
import { PhotoAdjusterModal } from "./components/PhotoAdjusterModal.tsx";
import { PostReviewModal } from "./components/PostReviewModal.tsx";
import { CatalogSearchModal } from "./components/CatalogSearchModal.tsx";
import { AddBusinessModal } from "./components/AddBusinessModal.tsx";
import { AssignTaskModal } from "./components/AssignTaskModal.tsx";
import { composeAndDownloadArtwork, downloadCampaignBundle } from "./utils/canvasExporter.ts";
import { postWorkflowJson, resolveWorkflowDrafts } from "./utils/workflowApi.js";
import { photoEnglishText } from "./utils/photoText.js";
import { getNextWorkflowBatch } from "./utils/workflowBatch.js";
import { classifyEgyptianNiche } from "../data/egyptian-niches.js";
import {
  Sparkles,
  Sliders,
  Plus,
  ArrowRight,
  Download,
  Search,
  RefreshCw,
  Bot,
  Send,
  ExternalLink,
  ShieldCheck,
  Eye
} from "lucide-react";
async function postWithRetry(url, body, attempts = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (response.ok || response.status < 500 && response.status !== 429 || attempt === attempts) return response;
      lastError = new Error(`CRM save failed (${response.status})`);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
  }
  throw lastError || new Error("CRM save failed.");
}
const botDefs = [
  {
    id: "lead",
    icon: "TL",
    name: "Team lead & engineer",
    job: "Orchestrates work \xB7 monitors quality",
    state: "On watch",
    desc: "Checks each handoff against business profile and verified sources, fact-checks and revises copy, tests images against briefs.",
    task: "Supervising source, quality & platform checks",
    progress: 88
  },
  {
    id: "scout",
    icon: "AS",
    name: "Asset scout",
    job: "Finds fresh visual references and reusable assets",
    state: "Ready",
    desc: "Searches Openverse, Wikimedia Commons, and verified commercial photography libraries; verifies commercial license details.",
    task: "Source checks and license verification",
    progress: 100
  },
  {
    id: "artist",
    icon: "AD",
    name: "Art director",
    job: "Shapes imagery around each brand",
    state: "Working",
    desc: "Translates brand identity into distinct visual direction, lighting, composition, and authentic product styling.",
    task: "Composing visual campaign concepts",
    progress: 75
  },
  {
    id: "editor",
    icon: "VE",
    name: "Visual editor",
    job: "Builds & adjusts final photo artwork",
    state: "Working",
    desc: "Adjusts photo lighting, contrast, warmth, crop ratios (1:1, 4:5, 9:16), typography overlays, and design movements.",
    task: "Adjusting photo layouts, filters & typography",
    progress: 82
  },
  {
    id: "writer",
    icon: "CC",
    name: "Content creator",
    job: "Writes business-aware captions",
    state: "Working",
    desc: "Uses verified business profile, website facts, and platform guidance for Instagram, Facebook, TikTok, and LinkedIn.",
    task: "Drafting platform-native captions",
    progress: 64
  },
  {
    id: "publisher",
    icon: "PA",
    name: "Publishing assistant",
    job: "Prepares final review pack",
    state: "Ready",
    desc: "Packages ready-to-publish schedules and copy packs only after quality audits have passed.",
    task: "Review packs queued for owner check",
    progress: 100
  }
];
const defaultWorkflowSteps = () => [
  { id: "research", botId: "scout", name: "Public niche research", enabled: true, required: true, instructions: "Before writing, research this business niche and service area. Gather current public examples, audience questions, offers and trends. Cite sources, use only supportable facts, and never copy source wording." },
  { id: "writing", botId: "writer", name: "Post writing", enabled: true, required: true, instructions: "Write original, platform-native content grounded in this run\u2019s niche research. Avoid duplicate ideas, hooks, examples and calls to action across all previous business posts." },
  { id: "copy-review", botId: "lead", name: "Engineer copy review", enabled: true, required: true, instructions: "Check each post against the full campaign history for semantic duplicates, then verify facts, restrictions, brand fit, audience fit, research support, bilingual captions and usefulness. Rewrite any weak or repetitive item before approval." },
  { id: "art-direction", botId: "artist", name: "Art direction", enabled: true, required: true, instructions: "Create a distinct, catchy photo concept for every post. Avoid repeating campaign scenes, composition, palette, lighting or camera angle." },
  { id: "image-search", botId: "scout", name: "Niche-matched image search", enabled: true, required: true, instructions: "Find or generate distinct imagery matching the exact niche, location and visual brief." },
  { id: "photo-edit", botId: "editor", name: "Photo layout and engineer visual audit", enabled: true, required: true, instructions: "Inspect each actual photo against the niche and art brief. Flag mismatches, low quality, text or logos, and repeated designs. Prepare a distinct, legible layout for every approved photo." },
  { id: "owner-handoff", botId: "publisher", name: "Owner handoff and audit", enabled: true, required: true, instructions: "Verify every draft has copy, source context where available, a niche-matched photo or explicit missing-photo status, then hand off for owner approval." }
];
const normalizeWorkflow = (workflow) => ({
  ...workflow,
  researchEnabled: true,
  steps: Array.isArray(workflow.steps) ? workflow.steps.map((step) => ({ ...step, id: step.id || `step-${Math.random().toString(36).slice(2, 7)}`, ...step.id === "research" || step.id === "art-direction" || step.id === "image-search" || step.id === "photo-edit" ? { enabled: true, required: true } : {} })) : defaultWorkflowSteps()
});
const creativePalettes = [
  { name: "Cairo Heritage", colors: ["#6B1F2A", "#D8B36A"] },
  { name: "Nile Teal", colors: ["#155E63", "#E8C979"] },
  { name: "Desert Sand", colors: ["#8B5E3C", "#E9D7B5"] },
  { name: "Alexandria Blue", colors: ["#174A72", "#F0C987"] },
  { name: "Date Palm", colors: ["#355B3E", "#D7B77A"] },
  { name: "Lotus Rose", colors: ["#8D4057", "#E8C8BB"] },
  { name: "Modern Cairo", colors: ["#29313A", "#E2A66F"] },
  { name: "Oasis", colors: ["#4B6B50", "#D6E0B2"] },
  { name: "Spice Market", colors: ["#A9472D", "#F1C45B"] },
  { name: "Mediterranean", colors: ["#23617B", "#F1E9D2"] },
  { name: "Amethyst Night", colors: ["#514064", "#D4B9E8"] },
  { name: "Clean Studio", colors: ["#292929", "#F2F0EB"] }
];
function App() {
  const [businesses, setBusinesses] = useState([]);
  const [posts, setPosts] = useState([]);
  const [botTasks, setBotTasks] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const workflowsRef = useRef([]);
  const [learning, setLearning] = useState([]);
  const [currentBizId, setCurrentBizId] = useState("findat");
  const [currentView, setCurrentView] = useState("overview");
  const [ownerUsername, setOwnerUsername] = useState("");
  const swarmContextRef = useRef(null);
  const postsRef = useRef([]);
  const businessesRef = useRef([]);
  const [adjustingPost, setAdjustingPost] = useState(null);
  const [reviewingPost, setReviewingPost] = useState(null);
  const [catalogSearchPost, setCatalogSearchPost] = useState(null);
  const [isAddBizOpen, setIsAddBizOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [chatBot, setChatBot] = useState("editor");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const [isRunningWorkflow, setIsRunningWorkflow] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState("");
  const [workflowElapsed, setWorkflowElapsed] = useState(0);
  const [workflowRun, setWorkflowRun] = useState(null);
  const [isBundleDownloading, setIsBundleDownloading] = useState(false);
  const [bundleProgress, setBundleProgress] = useState("");
  const [toastMsg, setToastMsg] = useState(null);
  useEffect(() => {
    workflowsRef.current = workflows;
  }, [workflows]);
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);
  useEffect(() => {
    businessesRef.current = businesses;
  }, [businesses]);
  useEffect(() => {
    const onSwarmMessage = async (event) => {
      if (event.origin !== window.location.origin || !event.data?.type?.startsWith("swarm:")) return;
      const reply = (data) => event.source?.postMessage(data, event.origin);
      if (event.data.type === "swarm:tts-request") {
        const swarmFrame = Array.from(document.querySelectorAll("iframe")).find((frame) => frame.title === "Swarm Engine");
        const requestId = String(event.data.requestId || "");
        const payload = event.data.payload || {};
        if (!requestId || event.source !== swarmFrame?.contentWindow || typeof payload.text !== "string" || !payload.text.trim() || payload.text.length > 12e3) return;
        try {
          const speak = window.websim?.textToSpeech;
          if (typeof speak !== "function") throw new Error("Websim voiceover service is unavailable in the CRM host.");
          const result = await speak.call(window.websim, { text: payload.text, voice: ["en-female", "en-male"].includes(payload.voice) ? payload.voice : "en-male", generateFile: true });
          if (!result?.url) throw new Error("Voiceover service returned no audio file.");
          reply({ type: "swarm:tts-result", requestId, ok: true, result: { url: result.url } });
        } catch (error) {
          reply({ type: "swarm:tts-result", requestId, ok: false, status: Number(error?.status || error?.statusCode || error?.response?.status) || void 0, retryAfter: Number(error?.retryAfter || error?.response?.headers?.get?.("retry-after")) || void 0, error: String(error?.message || error).slice(0, 300) });
        }
        return;
      }
      if (event.data.type === "swarm:request-context") {
        const context = swarmContextRef.current;
        if (context) reply({ type: "swarm:context", context });
        return;
      }
      if (event.data.type === "swarm:update-business") {
        const { businessId, patch } = event.data;
        if (!businessId || !patch || typeof patch !== "object") return;
        const updated = businessesRef.current.map((business) => business.id === businessId ? { ...business, ...patch } : business);
        try {
          const response = await fetch("/api/crm/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businesses: updated }) });
          if (!response.ok) throw new Error("Could not save business assets to the CRM.");
          businessesRef.current = updated;
          setBusinesses(updated);
          reply({ type: "swarm:save-result", ok: true, businessId });
        } catch (error) {
          reply({ type: "swarm:save-result", ok: false, businessId, error: error.message });
        }
        return;
      }
      if (event.data.type === "swarm:update-run") {
        const { businessId, runId, run } = event.data;
        if (!businessId || !runId || !run) return;
        const updatedBusinesses = businessesRef.current.map((item) => item.id === businessId ? { ...item, swarmRuns: (item.swarmRuns || []).map((saved) => saved.id === runId ? run : saved) } : item);
        const updatedPosts = postsRef.current.map((post) => post.id.startsWith(`swarm-${runId}-`) ? {
          ...post,
          title: run.videos?.[Number(post.id.split("-").at(-1)) - 1]?.title || post.title,
          videoPrompts: run.videos?.[Number(post.id.split("-").at(-1)) - 1] ? {
            script: String(run.videos[Number(post.id.split("-").at(-1)) - 1].script || ""),
            visuals: String(run.videos[Number(post.id.split("-").at(-1)) - 1].visuals || ""),
            avatar: String(run.videos[Number(post.id.split("-").at(-1)) - 1].avatar || ""),
            render: typeof run.videos[Number(post.id.split("-").at(-1)) - 1].render === "string" ? run.videos[Number(post.id.split("-").at(-1)) - 1].render : JSON.stringify(run.videos[Number(post.id.split("-").at(-1)) - 1].render || {}, null, 2)
          } : post.videoPrompts,
          videoUrl: run.videos?.[Number(post.id.split("-").at(-1)) - 1]?.videoUrl || post.videoUrl,
          videoApproved: !!run.videos?.[Number(post.id.split("-").at(-1)) - 1]?.approved
        } : post);
        try {
          const response = await fetch("/api/crm/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businesses: updatedBusinesses, posts: updatedPosts }) });
          if (!response.ok) throw new Error("Could not save video prompt edits to the CRM.");
          businessesRef.current = updatedBusinesses;
          postsRef.current = updatedPosts;
          setBusinesses(updatedBusinesses);
          setPosts(updatedPosts);
          reply({ type: "swarm:save-result", ok: true, businessId, runId });
        } catch (error) {
          reply({ type: "swarm:save-result", ok: false, businessId, runId, error: error.message });
        }
        return;
      }
      if (event.data.type === "swarm:save-run") {
        const { businessId, runId, title, drafts, summary, run } = event.data;
        const business = businessesRef.current.find((item) => item.id === businessId);
        if (!business || !Array.isArray(drafts) || !drafts.length) return;
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const runPosts = drafts.slice(0, 5).map((draft, index) => ({
          id: `swarm-${runId}-${index + 1}`,
          businessId,
          platform: (business.channels || ["Instagram"])[index % (business.channels || ["Instagram"]).length],
          time: "09:00",
          status: "Swarm draft \xB7 engineer review pending",
          title: String(draft.title || `Video ${index + 1}`).slice(0, 140),
          caption: String(draft.caption || `Video concept: ${draft.title || `Video ${index + 1}`}. Review the attached video script and production prompts.`).slice(0, 5e3),
          tone: business.tone,
          art: business.theme,
          headline: String(draft.title || `Video ${index + 1}`).slice(0, 80),
          visualBrief: String(draft.visuals || "").slice(0, 900),
          contentFormat: `Swarm video \xB7 ${String(draft.style || "Video")}`,
          researchSources: (run?.sources || []).slice(0, 5).map((source) => ({ title: String(source.title || source.platform || "Public source").slice(0, 140), url: String(source.url || "").slice(0, 400), snippet: String(source.snippet || "").slice(0, 300), platform: source.platform, kind: source.kind })),
          videoPrompts: { script: String(draft.script || ""), visuals: String(draft.visuals || ""), avatar: String(draft.avatar || ""), render: typeof draft.render === "string" ? draft.render : JSON.stringify(draft.render || {}, null, 2) },
          videoUrl: String(draft.videoUrl || ""),
          videoApproved: !!draft.approved,
          createdAt: now,
          imageApproved: false,
          contentApproved: false,
          engineerReview: { content: "pending", visual: "pending", notes: ["Generated by Swarm Engine. Review the attached script and video prompts before approval."] }
        }));
        const existing = postsRef.current;
        const merged = [...runPosts, ...existing];
        const updatedBusinesses = businessesRef.current.map((item) => item.id === businessId ? { ...item, swarmRuns: [...item.swarmRuns || [], run].slice(-30) } : item);
        try {
          const sync = await postWithRetry("/api/crm/sync", { posts: merged, businesses: updatedBusinesses });
          if (!sync.ok) {
            const details = await sync.clone().json().catch(() => ({}));
            throw new Error(details.error || details.message || `CRM save failed (${sync.status}).`);
          }
          postsRef.current = merged;
          businessesRef.current = updatedBusinesses;
          setPosts(merged);
          setBusinesses(updatedBusinesses);
          const task = {
            id: `task-${runId}`,
            businessId,
            botId: "lead",
            title: `Review Swarm video batch \xB7 ${title}`,
            instructions: `Engineer review for Swarm Engine batch ${runId}. ${summary || ""} Check five distinct video concepts for business accuracy, workflow prompt alignment, originality, and safe claims. Review the Swarm video drafts in the Content Calendar and flag required edits before owner approval.`,
            status: "queued",
            priority: "normal",
            progress: 0,
            engineerNote: "Swarm batch queued for CRM Engineer review.",
            createdAt: now,
            updatedAt: now
          };
          const taskResponse = await fetch("/api/crm/bot-task", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(task) });
          const taskData = await taskResponse.json().catch(() => ({}));
          if (taskResponse.ok && taskData.task) setBotTasks((previous) => [taskData.task, ...previous]);
          reply({ type: "swarm:run-saved", ok: true, businessId, runId, postCount: runPosts.length, taskQueued: taskResponse.ok && !!taskData.task });
        } catch (error) {
          reply({ type: "swarm:run-saved", ok: false, businessId, runId, error: error.message });
        }
      }
    };
    window.addEventListener("message", onSwarmMessage);
    return () => window.removeEventListener("message", onSwarmMessage);
  }, []);
  useEffect(() => {
    window.websim?.getCreator().then((creator) => setOwnerUsername(creator?.username || "")).catch(() => {
    });
  }, []);
  useEffect(() => {
    if (!isRunningWorkflow && !botTasks.some((task) => task.status === "preparing" || task.status === "running")) return;
    const timer = window.setInterval(() => setWorkflowElapsed((value) => value + 1), 1e3);
    return () => window.clearInterval(timer);
  }, [isRunningWorkflow, botTasks]);
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };
  useEffect(() => {
    const applyData = (data) => {
      const nextBusinesses = data.businesses || [];
      setBusinesses(nextBusinesses);
      if (nextBusinesses.length && !nextBusinesses.some((b) => b.id === "northstar")) {
        setCurrentBizId(nextBusinesses[0].id);
      }
      setPosts(data.content || data.posts || []);
      const loadedTasks = data.tasks || data.botTasks || [];
      setBotTasks(loadedTasks.map((task) => ({
        ...task,
        status: { in_progress: "failed", needs_review: task.result ? "completed" : "failed", complete: "completed" }[task.status] || task.status,
        reviewStatus: task.reviewStatus || (task.status === "complete" ? "approved" : task.status === "needs_review" && task.result ? "pending" : void 0)
      })));
      const loadedWorkflows = (data.workflows || []).map((workflow) => normalizeWorkflow({
        ...workflow,
        postsPerRun: Math.max(10, Math.min(100, Number(workflow.postsPerRun) || 100)),
        dailyGoal: Math.max(1, Number(workflow.dailyGoal) || 100),
        contentMix: workflow.contentMix || "educational, product or service spotlight, behind the scenes, social proof, community, offer",
        imageMode: workflow.imageMode || "catalog-first",
        researchEnabled: workflow.researchEnabled !== false,
        language: workflow.language || "Mixed",
        postingTimes: workflow.postingTimes?.length ? workflow.postingTimes : ["09:00", "11:30", "14:00", "16:30", "18:00", "20:00"],
        lastRun: workflow.lastRun?.status === "running" ? { ...workflow.lastRun, status: "interrupted", activeStep: "Run stopped when the page closed", note: "The saved supervision record shows an unfinished run. Review its partial drafts, then restart the workflow." } : workflow.lastRun
      }));
      setWorkflows(loadedWorkflows);
      setLearning(data.learning || []);
      setChatMessages(data.chat || []);
    };
    const bootstrap = async () => {
      try {
        const saved = await fetch("/api/crm/bootstrap");
        if (saved.ok) {
          const data = await saved.json();
          if (data.businesses?.length) {
            applyData(data);
            return;
          }
        }
      } catch (err) {
        console.warn("Saved workspace unavailable; loading demo data.", err);
      }
      try {
        const seed = await fetch("/data/crm-seed.json").then((res) => res.json());
        applyData(seed);
        const user = await window.websim?.getUser().catch(() => null);
        if (user && user.username !== "anonymous") {
          fetch("/api/crm/bootstrap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(seed)
          }).catch(() => {
          });
        }
      } catch (err) {
        console.error("Could not load workspace data.", err);
      }
    };
    bootstrap();
  }, []);
  const currentBiz = businesses.find((b) => b.id === currentBizId) || businesses[0] || {
    id: "northstar",
    name: "Northstar Coffee",
    industry: "Cafe & roastery",
    initial: "N",
    theme: "burgundy",
    headingFont: "DM Serif Display",
    bodyFont: "DM Sans",
    tone: "Warm, grounded, a little adventurous",
    audience: "Neighborhood coffee lovers",
    channels: ["Instagram", "Facebook", "TikTok"],
    description: "Small-batch coffee for slow mornings and big ideas."
  };
  const businessPosts = posts.filter((p) => p.businessId === currentBiz.id);
  const pendingPosts = businessPosts.filter((p) => !p.imageApproved || !p.contentApproved);
  const openTasks = botTasks.filter((t) => t.businessId === currentBiz.id && (t.status !== "completed" || t.reviewStatus !== "approved"));
  const todayKey = (/* @__PURE__ */ new Date()).toDateString();
  const todayCount = businessPosts.filter((post) => post.createdAt && new Date(post.createdAt).toDateString() === todayKey).length;
  const currentWorkflow = workflows.find((w) => w.businessId === currentBiz.id) || {
    id: `wf-${currentBiz.id}`,
    businessId: currentBiz.id,
    name: `${currentBiz.name} daily content`,
    postsPerRun: 100,
    dailyGoal: 100,
    channels: currentBiz.channels || ["Instagram"],
    instructions: "Create original, brand-tailored content.",
    revision: 1,
    steps: defaultWorkflowSteps()
  };
  const workflowSteps = currentWorkflow.steps || defaultWorkflowSteps();
  const workflowReady = ["research", "writing", "copy-review", "art-direction", "image-search", "photo-edit", "owner-handoff"].every((id) => workflowSteps.some((step) => step.id === id && step.enabled)) && currentWorkflow.researchEnabled !== false;
  const currentWorkflowRun = workflowRun?.businessId === currentBiz.id ? workflowRun : null;
  const workflowTarget = Math.max(10, Math.min(100, Number(currentWorkflow.postsPerRun) || 100));
  const savedWorkflowRun = currentWorkflow.lastRun;
  const { batchNumber: workflowBatchNumber, batchSize: workflowBatchSize } = getNextWorkflowBatch(workflowTarget, savedWorkflowRun);
  swarmContextRef.current = {
    business: currentBiz,
    businesses,
    workflow: currentWorkflow,
    bots: botDefs,
    nicheKnowledge: classifyEgyptianNiche({ query: currentBiz.industry, business: currentBiz }),
    recentPosts: posts.filter((post) => post.businessId === currentBiz.id).slice(0, 20).map((post) => ({ title: post.title, caption: post.caption, contentFormat: post.contentFormat, imageSource: post.imageSource ? { title: post.imageSource.title, license: post.imageSource.license, provider: post.imageSource.provider, sourceUrl: post.imageSource.foreign_landing_url } : void 0 }))
  };
  const handleUpdatePost = (updated) => {
    const nextPosts = postsRef.current.map((post) => post.id === updated.id ? updated : post);
    postsRef.current = nextPosts;
    setPosts(nextPosts);
    let nextBusinesses = businessesRef.current;
    if (updated.id.startsWith("swarm-")) {
      const lastHyphen = updated.id.lastIndexOf("-");
      const runId = updated.id.slice(6, lastHyphen);
      const videoIndex = Number(updated.id.slice(lastHyphen + 1)) - 1;
      nextBusinesses = businessesRef.current.map((business) => business.id === updated.businessId ? { ...business, swarmRuns: (business.swarmRuns || []).map((run) => run.id === runId ? { ...run, videos: (run.videos || []).map((video, index) => index === videoIndex ? { ...video, ...updated.videoPrompts, title: updated.title } : video), updatedAt: (/* @__PURE__ */ new Date()).toISOString() } : run) } : business);
      businessesRef.current = nextBusinesses;
      setBusinesses(nextBusinesses);
    }
    fetch("/api/crm/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posts: nextPosts, businesses: nextBusinesses })
    }).catch(console.warn);
  };
  const handleAddBusiness = async (newBiz) => {
    const editing = businesses.some((business) => business.id === newBiz.id);
    const updatedBusinesses = editing ? businesses.map((business) => business.id === newBiz.id ? newBiz : business) : [newBiz, ...businesses];
    const newWorkflow = editing ? void 0 : {
      id: `wf-${newBiz.id}`,
      businessId: newBiz.id,
      name: `${newBiz.name} daily content`,
      postsPerRun: 100,
      dailyGoal: 100,
      contentMix: "educational, product or service spotlight, behind the scenes, social proof, community, offer",
      imageMode: "catalog-first",
      researchEnabled: true,
      language: "Mixed",
      postingTimes: ["09:00", "11:30", "14:00", "16:30", "18:00", "20:00"],
      channels: newBiz.channels || ["Instagram"],
      instructions: "Produce original, tailored posts adhering to brand tone and verified facts.",
      revision: 1,
      steps: defaultWorkflowSteps()
    };
    const updatedWorkflows = newWorkflow ? [newWorkflow, ...workflows] : workflows;
    try {
      const response = await fetch("/api/crm/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businesses: updatedBusinesses, ...newWorkflow ? { workflows: updatedWorkflows } : {} }) });
      if (!response.ok) throw new Error("The backend did not save this business profile.");
      setBusinesses(updatedBusinesses);
      if (newWorkflow) {
        setWorkflows(updatedWorkflows);
        setCurrentBizId(newBiz.id);
        setCurrentView("overview");
      }
      return true;
    } catch (error) {
      showToast(error.message || "Could not save business changes.");
      return false;
    }
  };
  const handleAssignTask = async (task) => {
    try {
      const response = await fetch("/api/crm/bot-task", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(task) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.task) throw new Error(payload.error || "Task could not be saved by the backend.");
      setBotTasks((prev) => [payload.task, ...prev]);
      return true;
    } catch (error) {
      showToast(error.message || "Task could not be saved.");
      return false;
    }
  };
  const handleUpdateTaskStatus = async (taskId, status, patch = {}) => {
    try {
      const response = await fetch("/api/crm/bot-task-update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: taskId, status, ...patch }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.task) throw new Error(payload.error || "Backend rejected the task transition.");
      setBotTasks((prev) => prev.map((task) => task.id === taskId ? payload.task : task));
      return payload.task;
    } catch (error) {
      showToast(error.message || "Task status could not be saved.");
      return null;
    }
  };
  const handleExecuteBotTask = async (task) => {
    if (task.status === "preparing" || task.status === "running") return;
    let settled = false;
    const runRequest = fetch("/api/crm/team-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskId: task.id, businessId: task.businessId, botId: task.botId, content: `Execute this assigned task and return the result for engineer review. Task: ${task.title}
Instructions: ${task.instructions}` }) });
    void runRequest.then(() => {
      settled = true;
    }, () => {
      settled = true;
    });
    try {
      while (!settled) {
        const statusResponse = await fetch(`/api/crm/bot-task?id=${encodeURIComponent(task.id)}`);
        const statusPayload = await statusResponse.json().catch(() => ({}));
        if (statusResponse.ok && statusPayload.task) setBotTasks((prev) => prev.map((item) => item.id === task.id ? statusPayload.task : item));
        if (settled) break;
        await Promise.race([runRequest.then(() => void 0, () => void 0), new Promise((resolve) => window.setTimeout(resolve, 700))]);
      }
      const response = await runRequest;
      const payload = await response.json().catch(() => ({}));
      if (payload.task) setBotTasks((prev) => prev.map((item) => item.id === task.id ? payload.task : item));
      if (!response.ok || !payload.message?.content) throw new Error(payload.error || "The backend job could not complete.");
      showToast(`${botDefs.find((bot) => bot.id === task.botId)?.name || "Bot"} job ${payload.task?.status || "completed"}.`);
    } catch (error) {
      showToast(error.message || "The backend job could not complete.");
    }
  };
  const setWorkflowBot = (botId, state, step) => {
    const now = Date.now();
    setWorkflowRun((previous) => {
      if (!previous) return previous;
      const botTimes = { ...previous.botTimes };
      const active = botTimes[previous.activeBot];
      if (active?.startedAt) botTimes[previous.activeBot] = { ...active, elapsedMs: active.elapsedMs + now - active.startedAt, startedAt: void 0, state: "Complete" };
      const next = botTimes[botId] || { elapsedMs: 0, state: "Waiting", step: "" };
      botTimes[botId] = { ...next, state, step, startedAt: state === "Working" ? now : void 0 };
      return { ...previous, activeBot: botId, activeStep: step, botTimes };
    });
  };
  const updateCurrentWorkflow = (patch) => {
    const updated = normalizeWorkflow({ ...currentWorkflow, ...patch });
    setWorkflows((prev) => prev.some((workflow) => workflow.id === updated.id) ? prev.map((workflow) => workflow.id === updated.id ? updated : workflow) : [updated, ...prev]);
    return updated;
  };
  const saveWorkflowAudit = async (audit) => {
    const latest = workflowsRef.current.find((workflow) => workflow.id === currentWorkflow.id) || currentWorkflow;
    const updated = normalizeWorkflow({ ...latest, lastRun: audit });
    const workflowSet = workflowsRef.current.some((workflow) => workflow.id === updated.id) ? workflowsRef.current.map((workflow) => workflow.id === updated.id ? updated : workflow) : [updated, ...workflowsRef.current];
    setWorkflows(workflowSet);
    const response = await fetch("/api/crm/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflows: workflowSet })
    });
    if (!response.ok) throw new Error("The engineer supervision record could not be saved.");
  };
  const updateWorkflowStep = (stepId, patch) => {
    const steps = (currentWorkflow.steps || defaultWorkflowSteps()).map((step) => step.id === stepId ? { ...step, ...patch } : step);
    updateCurrentWorkflow({ steps });
  };
  const handleDownloadCampaign = async () => {
    if (isBundleDownloading) return;
    const campaignPosts = posts.filter((post) => post.businessId === currentBiz.id);
    if (!campaignPosts.length) {
      showToast("There are no campaign photos ready to download.");
      return;
    }
    setIsBundleDownloading(true);
    setBundleProgress(`Preparing 0/${campaignPosts.length} photos`);
    try {
      await downloadCampaignBundle(campaignPosts, currentBiz, (done, total) => setBundleProgress(`Preparing ${done}/${total} photos`));
      showToast(`Downloaded ${campaignPosts.length} artworks and captions as a ZIP.`);
    } catch (error) {
      showToast("Campaign download error: " + (error.message || "Could not create the ZIP."));
    } finally {
      setIsBundleDownloading(false);
      setBundleProgress("");
    }
  };
  const handleDownloadPost = async (post) => {
    try {
      await composeAndDownloadArtwork(post, currentBiz, post.adjustments || {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        warmth: 0,
        vignette: 10,
        aspectRatio: "1:1",
        movement: "editorial",
        overlayStyle: "classic"
      });
      showToast("Artwork downloaded to your device.");
    } catch (error) {
      showToast("Artwork download error: " + (error?.message || "Could not download this image."));
    }
  };
  const handleRunWorkflow = async () => {
    if (isRunningWorkflow) return;
    const { target: targetCount, startAt, batchEnd, batchNumber } = getNextWorkflowBatch(currentWorkflow.postsPerRun, currentWorkflow.lastRun);
    const steps = currentWorkflow.steps || defaultWorkflowSteps();
    const stepEnabled = (id) => steps.some((step) => step.id === id && step.enabled);
    const enabled = (id) => steps.some((step) => step.botId === id && step.enabled);
    const stepInstructions = (botId) => steps.filter((step) => step.botId === botId && step.enabled).map((step) => `${step.name}: ${step.instructions}`).join("\n");
    const stepInstruction = (stepId) => steps.filter((step) => step.id === stepId && step.enabled).map((step) => `${step.name}: ${step.instructions}`).join("\n");
    const scoutInstructions = (excludedStep) => steps.filter((step) => step.botId === "scout" && step.id !== excludedStep && step.enabled).map((step) => `${step.name}: ${step.instructions}`).join("\n");
    if (!["research", "writing", "copy-review", "art-direction", "image-search", "photo-edit", "owner-handoff"].every(stepEnabled) || currentWorkflow.researchEnabled === false) {
      showToast("Niche research, writing, engineer copy and visual reviews, photo sourcing, and owner handoff are required before a workflow can run.");
      return;
    }
    const now = Date.now();
    const audit = {
      id: `run-${now}`,
      status: "running",
      startedAt: new Date(now).toISOString(),
      generated: startAt,
      target: targetCount,
      activeStep: `Preparing batch ${batchNumber}`,
      note: `Batch ${batchNumber} of ${Math.ceil(targetCount / 10)} \xB7 up to 10 new posts`,
      botStates: Object.fromEntries(botDefs.map((bot) => [bot.id, { status: "Waiting", detail: "Waiting for its configured workflow step", elapsedMs: 0 }]))
    };
    const botTimers = Object.fromEntries(botDefs.map((bot) => [bot.id, { elapsedMs: 0 }]));
    let activeAuditBot = null;
    const markBot = (botId, status, detail) => {
      const at = Date.now();
      if (activeAuditBot && activeAuditBot !== botId && botTimers[activeAuditBot].startedAt) {
        const timer2 = botTimers[activeAuditBot];
        timer2.elapsedMs += at - timer2.startedAt;
        timer2.startedAt = void 0;
        if (audit.botStates[activeAuditBot]?.status === "Working") audit.botStates[activeAuditBot] = { ...audit.botStates[activeAuditBot], status: "Complete", elapsedMs: timer2.elapsedMs };
      }
      const timer = botTimers[botId] || (botTimers[botId] = { elapsedMs: 0 });
      if (timer.startedAt) {
        timer.elapsedMs += at - timer.startedAt;
        timer.startedAt = void 0;
      }
      if (status === "Working") timer.startedAt = at;
      audit.botStates[botId] = { status, detail, elapsedMs: timer.elapsedMs };
      activeAuditBot = status === "Working" ? botId : null;
      setWorkflowBot(botId, status, detail);
    };
    setIsRunningWorkflow(true);
    setWorkflowElapsed(0);
    setWorkflowRun({ businessId: currentBiz.id, total: targetCount, completed: startAt, activeBot: "lead", activeStep: `Preparing batch ${batchNumber}`, startedAt: now, botTimes: Object.fromEntries(botDefs.map((bot) => [bot.id, { elapsedMs: 0, state: "Waiting", step: "" }])) });
    setWorkflowStatus(`Preparing batch ${batchNumber} \xB7 ${startAt}/${targetCount}`);
    await saveWorkflowAudit(audit).catch((error) => console.warn("Could not save supervision record.", error));
    showToast(`Running batch ${batchNumber} \xB7 up to ${batchEnd - startAt} posts for ${currentBiz.name}...`);
    const newBatch = [];
    let requiredResearchMissing = false;
    try {
      const classification = classifyEgyptianNiche({ query: currentBiz.industry, business: currentBiz });
      const channels = currentWorkflow.channels?.length ? currentWorkflow.channels : currentBiz.channels?.length ? currentBiz.channels : ["Instagram"];
      let workflowResearchSources = [];
      const shouldResearch = currentWorkflow.researchEnabled !== false && stepEnabled("research");
      if (shouldResearch) {
        setWorkflowStatus(`Researching niche for batch ${batchNumber} \xB7 preparing ${batchEnd - startAt} posts`);
        markBot("scout", "Working", "Gathering public niche references before copy generation");
        try {
          const researchRes = await fetch("/api/crm/research", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId: currentBiz.id, classification, instructions: stepInstruction("research") })
          });
          const researchData = await researchRes.json().catch(() => ({}));
          if (!researchRes.ok) throw new Error(researchData.message || researchData.error || "Public research is temporarily unavailable.");
          workflowResearchSources = Array.isArray(researchData.sources) ? researchData.sources : [];
          if (!workflowResearchSources.length && steps.some((step) => step.id === "research" && step.required)) requiredResearchMissing = true;
          markBot("scout", workflowResearchSources.length ? "Complete" : "Needs attention", `${workflowResearchSources.length} public references found before writing${workflowResearchSources.length ? "" : " \xB7 drafts will use supplied business facts only"}`);
          setWorkflowStatus(`Niche research ready \xB7 writing ${batchEnd - startAt} distinct posts`);
        } catch (error) {
          requiredResearchMissing = steps.some((step) => step.id === "research" && step.required);
          markBot("scout", "Needs attention", error?.message || "Public research is temporarily unavailable.");
          setWorkflowStatus(`Research unavailable \xB7 writing ${batchEnd - startAt} posts from the business profile`);
        }
      }
      let index = startAt;
      while (index < batchEnd) {
        const count = Math.min(10, batchEnd - index);
        markBot("writer", "Working", `Researching and drafting posts ${index + 1}\u2013${index + count}`);
        setWorkflowStatus(`Writing ${index + 1}\u2013${index + count}/${targetCount} \xB7 using niche research`);
        const copyWorkflow = { ...currentWorkflow, language: "Mixed", researchEnabled: false, stepInstructions: { writer: stepInstructions("writer"), scout: `${stepInstruction("research")}
${scoutInstructions("image-search")}` } };
        const copyRes = await postWorkflowJson("/api/crm/generate-copy", { businessId: currentBiz.id, count, workflow: copyWorkflow, classification, researchEnabled: false, sources: workflowResearchSources, existingTitles: [...posts, ...newBatch].filter((post) => post.businessId === currentBiz.id).map((post) => post.title) });
        const copyData = await copyRes.json().catch(() => ({}));
        if (!copyRes.ok || !Array.isArray(copyData.posts) || !copyData.posts.length) throw new Error(copyData.message || copyData.error || `The writing bot could not create batch ${Math.floor(index / 10) + 1}.`);
        setWorkflowRun((previous) => previous ? { ...previous, prepared: Math.min(targetCount, index + copyData.posts.length), stageProgress: 35, activeBot: "writer", activeStep: `Generated ${Math.min(batchEnd, index + copyData.posts.length)}/${targetCount} distinct post drafts` } : previous);
        setWorkflowStatus(`Writer prepared ${copyData.posts.length}/${count} drafts \xB7 engineer review and visual preparation in progress`);
        const fallbackCopyUsed = !!copyData.generationWarning;
        if (!(copyData.sources || []).length) requiredResearchMissing = true;
        setWorkflowStatus(`Reviewing copy ${index + 1}\u2013${index + count}/${targetCount}`);
        if (stepEnabled("copy-review")) markBot("lead", "Working", `Checking batch ${Math.floor(index / 10) + 1} for originality, brand fit, and content restrictions`);
        let reviewRes = null;
        let reviewData = {};
        if (stepEnabled("copy-review")) {
          try {
            reviewRes = await fetch("/api/crm/review-copy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: currentBiz.id, classification, channels, posts: copyData.posts.slice(0, count), sources: copyData.sources, instructions: `${stepInstructions("lead")}
Owner handoff checks: ${stepInstructions("publisher")}` }) });
            reviewData = await reviewRes.json().catch(() => ({}));
          } catch (error) {
            reviewData = { error: error?.message || "The copy reviewer is temporarily unavailable." };
          }
        }
        const { drafts: concepts, reviewed: batchReviewed } = resolveWorkflowDrafts(copyData.posts, { ok: !!reviewRes?.ok, data: reviewData }, count);
        setWorkflowRun((previous) => previous ? { ...previous, stageProgress: 50, activeBot: "lead", activeStep: `Reviewing ${concepts.length}/${count} generated drafts` } : previous);
        let directedConcepts = concepts;
        let artDirectionComplete = !enabled("artist");
        if (enabled("artist")) {
          setWorkflowRun((previous) => previous ? { ...previous, stageProgress: 58, activeBot: "artist", activeStep: `Directing artwork for ${directedConcepts.length} drafts` } : previous);
          setWorkflowStatus(`Directing artwork ${index + 1}\u2013${index + count}/${targetCount}`);
          markBot("artist", "Working", `Creating niche-specific visual direction for ${directedConcepts.length} concepts`);
          const artRes = await fetch("/api/crm/direct-art", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId: currentBiz.id, classification, sources: copyData.sources, instructions: stepInstructions("artist"), posts: directedConcepts.map((post, postIndex) => ({ id: String(copyData.posts[postIndex]?.id || `${index}-${postIndex}`), title: post.title, format: post.format, visualBrief: post.visualBrief })) })
          });
          const artData = await artRes.json().catch(() => ({}));
          artDirectionComplete = artRes.ok && Array.isArray(artData.posts) && artData.posts.length === directedConcepts.length;
          if (artDirectionComplete) {
            directedConcepts = directedConcepts.map((concept, conceptIndex) => ({ ...concept, visualBrief: artData.posts[conceptIndex].visualBrief }));
            markBot("artist", "Complete", `Directed ${artData.directed || directedConcepts.length} niche-specific photo concepts`);
          } else {
            const reason = artData.error || "Art direction did not return a brief for every concept.";
            markBot("artist", "Needs attention", reason);
          }
        }
        for (let offset = 0; offset < directedConcepts.length; offset++) {
          const c = directedConcepts[offset];
          const i = index + offset;
          const platform = channels[i % channels.length];
          if (stepEnabled("image-search")) markBot("scout", "Working", `Finding a fresh ${classification.subNiche} photo for post ${i + 1}`);
          setWorkflowStatus(`Scouting photo ${i + 1}/${targetCount}`);
          setWorkflowRun((previous) => previous ? { ...previous, stageProgress: 70 + Math.round(offset / Math.max(1, directedConcepts.length) * 25), activeBot: "scout", activeStep: `Sourcing photo ${offset + 1}/${directedConcepts.length} \xB7 ${newBatch.length}/${count} posts saved` } : previous);
          let imageUrl = "";
          let imageSource = null;
          let imageError = "";
          try {
            if (!stepEnabled("image-search")) throw new Error("Image sourcing is disabled in this workflow.");
            const photoRes = await fetch("/api/crm/search-photo", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ businessId: currentBiz.id, brief: `${c.visualBrief || c.title}. ${stepInstruction("image-search")} ${scoutInstructions("research")} ${stepInstructions("artist")} ${stepInstructions("editor")}`, classification, imageMode: currentWorkflow.imageMode || "catalog-first", visualInstructions: `${stepInstruction("image-search")} ${scoutInstructions("research")} ${stepInstructions("artist")} ${stepInstructions("editor")}` })
            });
            const photoData = await photoRes.json().catch(() => ({}));
            if (!photoRes.ok || !photoData.url) throw new Error(photoData.error || "No new photo was available.");
            imageUrl = photoData.url;
            imageSource = photoData.source;
          } catch (error) {
            imageError = error.message || "Photo search failed";
          }
          const title = photoEnglishText(c.title || `${currentBiz.name} \u2014 ${classification.subNiche}`);
          const post = {
            id: `post-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
            businessId: currentBiz.id,
            platform,
            time: (currentWorkflow.postingTimes?.length ? currentWorkflow.postingTimes : ["09:00", "11:30", "14:00", "16:30", "18:00", "20:00"])[i % (currentWorkflow.postingTimes?.length || 6)],
            status: imageUrl ? "Ready for review" : "Photo needed",
            title: title.slice(0, 140),
            caption: String(c.caption || "").trim(),
            tone: currentBiz.tone,
            art: currentBiz.theme,
            headline: photoEnglishText(c.headline || title).slice(0, 80),
            sub: photoEnglishText(c.sub || currentBiz.name).slice(0, 120),
            visualBrief: String(c.visualBrief || "").slice(0, 900),
            contentFormat: c.format || "Social post",
            researchSources: (copyData.sources || []).slice(0, 5).map((source) => ({ title: String(source.title || "").slice(0, 120), url: String(source.url || "").slice(0, 400), snippet: String(source.snippet || "").slice(0, 300), platform: source.platform, kind: source.kind })),
            designFont: currentBiz.headingFont || "DM Serif Display",
            designPalette: [currentBiz.websiteInsights?.colors?.[0] || "#5B0E14", currentBiz.websiteInsights?.colors?.[1] || "#F1E194"],
            imageUrl,
            imageSource,
            imageError: !imageUrl,
            imageStatus: imageError || "Photo matched to primary niche",
            imageApproved: false,
            contentApproved: false,
            visualReview: { approved: false, score: 0, notes: imageUrl ? `Photo selected for ${classification.subNiche}; engineer visual audit is pending.` : imageError, revisionDirection: `${imageUrl ? "Owner review and photo adjustments are pending. " : "Retry photo search or generate an image. "}${stepInstructions("editor")}` },
            copyReviewStatus: fallbackCopyUsed ? `Engineer copy review needed \xB7 ${copyData.generationWarning}` : batchReviewed ? "Engineer copy review passed \xB7 owner approval pending" : reviewRes?.ok ? "Engineer copy review blocked a repeated concept \xB7 owner approval required" : "Engineer copy review unavailable \xB7 owner approval required",
            engineerReview: { content: batchReviewed && !fallbackCopyUsed && !!(copyData.sources || []).length ? "approved" : "needs_attention", visual: "pending", notes: [String(reviewData.posts?.[offset]?.reviewNote || (batchReviewed ? "Engineer checked originality, niche research, facts, and bilingual copy." : "Engineer copy review has not passed.")).slice(0, 280)] },
            adjustments: { brightness: 100, contrast: 102, saturation: 104, warmth: 4, vignette: 12, aspectRatio: platform.toLowerCase().includes("tiktok") ? "9:16" : "1:1", movement: "editorial", overlayStyle: "classic" },
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          post.status = !post.researchSources?.length ? "Research needed" : post.engineerReview?.content !== "approved" ? "Engineer copy review needed" : imageUrl ? "Engineer visual review pending" : "Photo needed";
          if (stepEnabled("copy-review")) markBot("lead", batchReviewed && !fallbackCopyUsed ? "Working" : "Needs attention", fallbackCopyUsed ? `Template copy needs owner review: post ${i + 1}` : batchReviewed ? `Quality checked: post ${i + 1}` : `Engineer review did not pass for post ${i + 1}${reviewData.error ? ` \xB7 ${reviewData.error}` : ""}`);
          newBatch.push(post);
          setPosts((previous) => [post, ...previous]);
          setWorkflowRun((previous) => previous ? { ...previous, completed: startAt + newBatch.length } : previous);
          setWorkflowRun((previous) => previous ? { ...previous, stageProgress: 70 + Math.round((offset + 1) / Math.max(1, directedConcepts.length) * 25) } : previous);
          setWorkflowStatus(`Finished ${i + 1}/${targetCount}`);
        }
        index += directedConcepts.length;
        if (!directedConcepts.length) throw new Error("The writing bot returned an empty batch.");
        setWorkflowRun((previous) => previous ? { ...previous, completed: Math.min(targetCount, startAt + newBatch.length) } : previous);
        const synced = [...newBatch, ...posts];
        const syncRes = await fetch("/api/crm/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ posts: synced }) });
        if (!syncRes.ok) throw new Error("Posts were generated but could not be saved. Check the workspace connection and try again.");
        const batchPosts = newBatch.slice(-concepts.length);
        let editorComplete = !enabled("editor");
        if (enabled("editor")) {
          setWorkflowStatus(`Preparing layouts ${index - directedConcepts.length + 1}\u2013${index}/${targetCount}`);
          markBot("editor", "Working", `Applying editable crop, tone and typography settings to ${batchPosts.length} photos`);
          const editRes = await fetch("/api/crm/adjust-photos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId: currentBiz.id, postIds: batchPosts.map((post) => post.id), instructions: stepInstructions("editor") })
          });
          const editData = await editRes.json().catch(() => ({}));
          editorComplete = editRes.ok && Array.isArray(editData.posts) && editData.posts.length === batchPosts.length;
          if (editorComplete) {
            for (const editedPost of editData.posts) {
              const indexInBatch = newBatch.findIndex((post) => post.id === editedPost.id);
              if (indexInBatch >= 0) newBatch[indexInBatch] = editedPost;
            }
            setPosts((previous) => previous.map((post) => newBatch.find((edited) => edited.id === post.id) || post));
            const saveEdited = await fetch("/api/crm/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ posts: [...newBatch, ...posts] }) });
            if (!saveEdited.ok) throw new Error("The visual editor finished, but its artwork settings could not be saved.");
            const visualFailures = editData.posts.filter((post) => post.engineerReview?.visual !== "approved").length;
            markBot("editor", visualFailures ? "Needs attention" : "Complete", visualFailures ? `Engineer flagged ${visualFailures} of ${batchPosts.length} photos for visual follow-up.` : `Engineer checked all ${batchPosts.length} photos and prepared distinct layouts.`);
          } else {
            const note = editData.error || "The visual editor did not return settings for every photo.";
            markBot("editor", "Needs attention", note);
            if (steps.some((step) => step.botId === "editor" && step.enabled && step.required)) throw new Error(note);
          }
        }
        audit.generated = Math.min(targetCount, startAt + newBatch.length);
        audit.activeStep = `Saved batch ${batchNumber} \xB7 ${audit.generated}/${targetCount}`;
        markBot("writer", "Complete", `Wrote ${newBatch.length} drafts`);
        markBot("lead", stepEnabled("copy-review") ? batchReviewed && !fallbackCopyUsed ? "Complete" : "Needs attention" : "Skipped", stepEnabled("copy-review") ? fallbackCopyUsed ? "Template drafts need owner review." : batchReviewed ? "Reviewed latest batch; owner approval remains open." : "Review did not complete; drafts flagged for attention." : "Disabled in workflow settings.");
        const sourceCount = (copyData.sources || []).length;
        const researchMissing = stepEnabled("research") && currentWorkflow.researchEnabled !== false && sourceCount === 0;
        markBot("scout", researchMissing && steps.some((step) => step.id === "research" && step.required) ? "Needs attention" : stepEnabled("image-search") || stepEnabled("research") ? "Complete" : "Skipped", `${newBatch.filter((post) => post.imageUrl).length} photos matched so far \xB7 ${sourceCount} public references found in this batch.`);
        if (!enabled("artist")) markBot("artist", "Skipped", "Disabled in workflow settings.");
        else if (!artDirectionComplete) markBot("artist", "Needs attention", "Used the writer brief as fallback; review the art-direction issue above.");
        if (!enabled("editor")) markBot("editor", "Skipped", "Disabled in workflow settings.");
        await saveWorkflowAudit({ ...audit, botStates: { ...audit.botStates } }).catch((error) => console.warn("Could not save workflow progress.", error));
      }
      const photoCount = newBatch.filter((post) => post.imageUrl).length;
      const fallbackCount = newBatch.filter((post) => post.copyReviewStatus?.includes("fallback")).length;
      const reviewMissingCount = newBatch.filter((post) => post.copyReviewStatus?.includes("unavailable")).length;
      const visualReviewCount = newBatch.filter((post) => post.engineerReview?.visual !== "approved").length;
      const copyReviewCount = newBatch.filter((post) => post.engineerReview?.content !== "approved").length;
      const needsAttention = photoCount !== newBatch.length || fallbackCount > 0 || reviewMissingCount > 0 || copyReviewCount > 0 || visualReviewCount > 0 || audit.botStates.editor.status === "Needs attention" || audit.botStates.artist.status === "Needs attention" || requiredResearchMissing;
      setWorkflowRun((previous) => previous ? { ...previous, stageProgress: 100, prepared: targetCount } : previous);
      markBot("publisher", needsAttention ? "Needs attention" : "Complete", `Engineer reviewed copy and visual design for ${newBatch.length} drafts; ${copyReviewCount} copy checks, ${visualReviewCount} visual checks, and ${newBatch.length - photoCount} photos need attention`);
      audit.status = needsAttention ? "needs_attention" : "complete";
      audit.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
      audit.generated = Math.min(targetCount, startAt + newBatch.length);
      audit.activeStep = needsAttention ? `Batch ${batchNumber} needs owner review \xB7 ${audit.generated}/${targetCount}` : `Batch ${batchNumber} complete \xB7 ${audit.generated}/${targetCount}`;
      audit.note = `${audit.generated < targetCount ? `Batch ${batchNumber} complete. Run batch ${batchNumber + 1} to continue toward ${targetCount}. ` : "Target reached. Run again to start a fresh sequence. "}${needsAttention ? [newBatch.length !== photoCount ? `${newBatch.length - photoCount} draft(s) need photos` : "", fallbackCount ? `${fallbackCount} draft(s) use template copy and need owner review` : "", reviewMissingCount ? `${reviewMissingCount} draft(s) need copy review` : "", copyReviewCount ? `${copyReviewCount} copy review(s) did not pass` : "", visualReviewCount ? `${visualReviewCount} visual review(s) did not pass` : "", requiredResearchMissing ? "required public research returned no sources" : ""].filter(Boolean).join(" \xB7 ") || "A workflow step needs attention." : "Drafts are waiting for owner approval."}`;
      audit.botStates.publisher = { ...audit.botStates.publisher, status: needsAttention ? "Needs attention" : "Complete", detail: audit.activeStep };
      await saveWorkflowAudit({ ...audit, botStates: { ...audit.botStates } });
      setCurrentView("content");
      showToast(`Batch ${batchNumber} ${needsAttention ? "saved with follow-up work" : "complete"} \xB7 ${newBatch.length} new drafts (${audit.generated}/${targetCount} total), ${photoCount} matched photos.${audit.generated < targetCount ? ` Run batch ${batchNumber + 1} to continue.` : " Target reached."}`);
    } catch (err) {
      audit.status = newBatch.length ? "needs_attention" : "failed";
      audit.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
      audit.generated = Math.min(targetCount, startAt + newBatch.length);
      audit.activeStep = "Stopped for engineer attention";
      audit.note = String(err.message || "Workflow failed.");
      markBot("lead", "Needs attention", audit.note);
      await saveWorkflowAudit({ ...audit, botStates: { ...audit.botStates } }).catch((error) => console.warn("Could not save workflow failure.", error));
      showToast(`Workflow stopped after ${newBatch.length} posts: ${err.message}`);
    } finally {
      setIsRunningWorkflow(false);
      setWorkflowStatus("");
      setWorkflowRun((previous) => {
        if (!previous) return previous;
        const botTimes = { ...previous.botTimes };
        const active = botTimes[previous.activeBot];
        if (active?.startedAt) {
          const resultState = audit.status === "complete" ? "Complete" : "Needs attention";
          botTimes[previous.activeBot] = { ...active, elapsedMs: active.elapsedMs + Date.now() - active.startedAt, startedAt: void 0, state: resultState };
        }
        return { ...previous, botTimes };
      });
    }
  };
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;
    const userText = chatInput.trim();
    setChatInput("");
    setIsChatSending(true);
    const userMsg = {
      id: `chat-${Date.now()}-u`,
      businessId: currentBiz.id,
      botId: chatBot,
      role: "user",
      content: userText,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    setChatMessages((prev) => [...prev, userMsg]);
    try {
      const res = await fetch("/api/crm/team-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: currentBiz.id,
          botId: chatBot,
          content: userText
        })
      });
      if (!res.ok) throw new Error("Chat failed");
      const data = await res.json();
      if (data.message) {
        setChatMessages((prev) => [...prev, data.message]);
      }
    } catch (err) {
      const fallbackMsg = {
        id: `chat-${Date.now()}-a`,
        businessId: currentBiz.id,
        botId: chatBot,
        role: "assistant",
        content: `I've analyzed ${currentBiz.name}'s current drafts. You can click 'Adjust Photo' on any post card to have me recalibrate color warmth, aspect ratios, or typography overlays directly.`,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      setChatMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsChatSending(false);
    }
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "flex min-h-screen bg-[#f5f1e9] text-[#1d211b] font-sans antialiased", children: [
    toastMsg && /* @__PURE__ */ jsxDEV("div", { className: "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#2a1719] text-[#fff8ed] border border-white/10 shadow-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in", children: [
      /* @__PURE__ */ jsxDEV(Sparkles, { className: "w-4 h-4 text-[#f1e194]" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 893,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("span", { children: toastMsg }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 894,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 892,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV(
      Sidebar,
      {
        currentView,
        onSelectView: setCurrentView,
        businesses,
        currentBiz,
        onSelectBusiness: (b) => setCurrentBizId(b.id),
        onOpenAddBusiness: () => setIsAddBizOpen(true),
        todayCount,
        dailyGoal: currentWorkflow.dailyGoal || 100
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 899,
        columnNumber: 7
      },
      this
    ),
    /* @__PURE__ */ jsxDEV("div", { className: "flex-1 flex flex-col min-w-0", children: [
      /* @__PURE__ */ jsxDEV(Topbar, { currentBiz, currentView }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 912,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("main", { className: `flex-1 w-full mx-auto ${currentView === "swarm" ? "p-0 max-w-none overflow-hidden" : "p-6 sm:p-8 max-w-7xl overflow-y-auto"}`, children: [
        currentView === "swarm" && /* @__PURE__ */ jsxDEV(
          "iframe",
          {
            title: "Swarm Engine",
            src: "/swarm-engine-491.html",
            className: "block w-full border-0",
            style: { height: "calc(100vh - 64px)", minHeight: "760px" }
          },
          currentBiz.id,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 916,
            columnNumber: 13
          },
          this
        ),
        currentView === "overview" && /* @__PURE__ */ jsxDEV("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e8e2d8]", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] font-bold tracking-wider text-[#8a887b] uppercase mb-1", children: [
                currentBiz.industry.toUpperCase(),
                " \xB7 WORKSPACE"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 931,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("h1", { className: "text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1d211b]", children: "Good day, Dan B Clarks" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 934,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f] mt-1", children: [
                "Your ",
                currentBiz.name,
                " marketing operations and autonomous bot team at a glance."
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 937,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 930,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2.5", children: [
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => setIsAddBizOpen(true),
                  className: "px-3.5 py-2 rounded-xl border border-[#ded8cc] bg-white text-xs font-semibold text-[#493f38] hover:bg-[#f4efe4] transition-all flex items-center gap-1.5 shadow-xs",
                  children: [
                    /* @__PURE__ */ jsxDEV(Plus, { className: "w-3.5 h-3.5 text-[#5b0e14]" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 947,
                      columnNumber: 21
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { children: "Add Business" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 948,
                      columnNumber: 21
                    }, this)
                  ]
                },
                void 0,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 943,
                  columnNumber: 19
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: handleRunWorkflow,
                  disabled: isRunningWorkflow || !workflowReady,
                  className: "px-4 py-2 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50",
                  children: [
                    isRunningWorkflow ? /* @__PURE__ */ jsxDEV(RefreshCw, { className: "w-3.5 h-3.5 animate-spin text-[#f1e194]" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 957,
                      columnNumber: 23
                    }, this) : /* @__PURE__ */ jsxDEV(Sparkles, { className: "w-3.5 h-3.5 text-[#f1e194]" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 959,
                      columnNumber: 23
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { children: isRunningWorkflow ? workflowStatus : `Run Batch ${workflowBatchNumber} \xB7 ${workflowBatchSize} posts` }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 961,
                      columnNumber: 21
                    }, this)
                  ]
                },
                void 0,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 951,
                  columnNumber: 19
                },
                this
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 942,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 929,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-5", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "lg:col-span-8 p-6 rounded-2xl bg-gradient-to-br from-[#421017] via-[#5b0e14] to-[#6d1720] text-[#fff8ed] shadow-xl flex flex-col justify-between", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between text-[10px] font-bold tracking-widest text-[#f1e194] uppercase mb-3", children: [
                  /* @__PURE__ */ jsxDEV("span", { className: "flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsxDEV("span", { className: "w-2 h-2 rounded-full bg-[#acc8a2] animate-pulse" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 972,
                      columnNumber: 25
                    }, this),
                    "WORKFLOW PULSE ACTIVE"
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 971,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { children: "TODAY" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 975,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 970,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-end justify-between gap-4 mt-2", children: [
                  /* @__PURE__ */ jsxDEV("div", { children: [
                    /* @__PURE__ */ jsxDEV("h2", { className: "text-xl sm:text-2xl font-bold tracking-tight text-white", children: [
                      "Today for ",
                      currentBiz.name
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 980,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#eadbd4] mt-1 max-w-md", children: [
                      todayCount >= (currentWorkflow.dailyGoal || 100) ? "Daily post target achieved!" : `${(currentWorkflow.dailyGoal || 100) - todayCount} more post drafts needed to hit daily goal.`,
                      " ",
                      "Every photo and caption remains subject to owner sign-off."
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 983,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 979,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "text-right shrink-0", children: [
                    /* @__PURE__ */ jsxDEV("span", { className: "text-3xl sm:text-4xl font-extrabold text-[#f1e194] tracking-tight", children: todayCount }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 992,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "text-base font-semibold text-[#eadbd4]", children: [
                      " ",
                      "/ ",
                      currentWorkflow.dailyGoal || 100
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 995,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 991,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 978,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 969,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "mt-6 pt-4 border-t border-white/15", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "w-full h-2 rounded-full bg-white/20 overflow-hidden", children: /* @__PURE__ */ jsxDEV(
                  "div",
                  {
                    className: "h-full rounded-full bg-[#f1e194] transition-all duration-500",
                    style: {
                      width: `${Math.min(100, todayCount / (currentWorkflow.dailyGoal || 100) * 100)}%`
                    }
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 1006,
                    columnNumber: 23
                  },
                  this
                ) }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1005,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between text-[10px] text-[#e1d1c7] mt-2", children: [
                  /* @__PURE__ */ jsxDEV("span", { children: [
                    businessPosts.filter((p) => p.imageUrl).length,
                    " verified photos ready"
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1014,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { children: [
                    pendingPosts.length,
                    " drafts awaiting review"
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1015,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1013,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1004,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 968,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "lg:col-span-4 p-5 rounded-2xl bg-white border border-[#e8e2d8] shadow-sm flex flex-col justify-between", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between pb-3 border-b border-[#f0ece4]", children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "w-7 h-7 rounded-lg bg-[#5b0e14] text-[#f1e194] font-bold text-xs flex items-center justify-center", children: "TL" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1025,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV("div", { children: [
                      /* @__PURE__ */ jsxDEV("strong", { className: "block text-xs font-bold text-[#1d211b]", children: "Engineer Watch" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 1029,
                        columnNumber: 27
                      }, this),
                      /* @__PURE__ */ jsxDEV("small", { className: "block text-[10px] text-[#85867c]", children: "Autonomous Quality Supervision" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 1030,
                        columnNumber: 27
                      }, this)
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 1028,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1024,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: () => setCurrentView("agents"),
                      className: "text-[11px] font-bold text-[#5b0e14] hover:underline",
                      children: "Tasks \u2192"
                    },
                    void 0,
                    false,
                    {
                      fileName: "<stdin>",
                      lineNumber: 1033,
                      columnNumber: 23
                    },
                    this
                  )
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1023,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "mt-3 space-y-2", children: [
                  openTasks.slice(0, 3).map((task) => /* @__PURE__ */ jsxDEV("div", { className: "p-2.5 rounded-xl bg-[#faf8f2] border border-[#ece8df]", children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between text-[11px]", children: [
                      /* @__PURE__ */ jsxDEV("strong", { className: "font-semibold text-[#1d211b] truncate max-w-[180px]", children: task.title }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 1045,
                        columnNumber: 29
                      }, this),
                      /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold text-[#527247]", children: [
                        task.progress,
                        "%"
                      ] }, void 0, true, {
                        fileName: "<stdin>",
                        lineNumber: 1048,
                        columnNumber: 29
                      }, this)
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 1044,
                      columnNumber: 27
                    }, this),
                    /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-[#73796f] mt-0.5 truncate", children: task.instructions }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1050,
                      columnNumber: 27
                    }, this)
                  ] }, task.id, true, {
                    fileName: "<stdin>",
                    lineNumber: 1043,
                    columnNumber: 25
                  }, this)),
                  openTasks.length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "text-center py-6 text-xs text-[#85867c]", children: [
                    /* @__PURE__ */ jsxDEV(ShieldCheck, { className: "w-6 h-6 text-[#527247] mx-auto mb-1" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1056,
                      columnNumber: 27
                    }, this),
                    /* @__PURE__ */ jsxDEV("p", { children: [
                      "All bot tasks for ",
                      currentBiz.name,
                      " are completed and verified."
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 1057,
                      columnNumber: 27
                    }, this)
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1055,
                    columnNumber: 25
                  }, this)
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1041,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1022,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => setCurrentView("agents"),
                  className: "w-full mt-3 py-2 rounded-xl bg-[#faf8f2] hover:bg-[#f2ece1] text-[#493f38] text-xs font-semibold border border-[#ded8cc] transition-colors",
                  children: "View Bot Team Activity"
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 1063,
                  columnNumber: 19
                },
                this
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1021,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 967,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("h3", { className: "text-base font-bold text-[#1d211b]", children: "Recent Campaign Drafts" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1076,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f]", children: "Inspect images, adjust aspect ratios & typography, or mark ready to publish." }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1077,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1075,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => setCurrentView("content"),
                  className: "text-xs font-bold text-[#5b0e14] hover:underline flex items-center gap-1",
                  children: [
                    /* @__PURE__ */ jsxDEV("span", { children: "Full Calendar" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1085,
                      columnNumber: 21
                    }, this),
                    /* @__PURE__ */ jsxDEV(ArrowRight, { className: "w-3.5 h-3.5" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1086,
                      columnNumber: 21
                    }, this)
                  ]
                },
                void 0,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 1081,
                  columnNumber: 19
                },
                this
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1074,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5", children: businessPosts.slice(0, 3).map((post) => /* @__PURE__ */ jsxDEV(
              "div",
              {
                className: "rounded-2xl border border-[#e8e2d8] overflow-hidden bg-white shadow-sm hover:shadow-md transition-all flex flex-col group",
                children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "aspect-[4/3] bg-[#211a19] relative overflow-hidden", children: [
                    post.imageUrl ? /* @__PURE__ */ jsxDEV("img", { src: post.imageUrl, alt: post.title, referrerPolicy: "no-referrer", className: "w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1098,
                      columnNumber: 42
                    }, this) : /* @__PURE__ */ jsxDEV("div", { className: "w-full h-full flex items-center justify-center bg-gradient-to-br from-[#332b29] to-[#5b0e14] text-xs font-semibold text-white/80", children: [
                      "Photo needed \xB7 ",
                      currentBiz.industry
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 1098,
                      columnNumber: 213
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 text-[#f1e194] backdrop-blur-xs", children: post.platform }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1099,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV(
                      "span",
                      {
                        className: `absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${post.imageApproved && post.contentApproved ? "bg-[#eef4e9] text-[#527247]" : "bg-[#fff0df] text-[#a55c2a]"}`,
                        children: post.imageApproved && post.contentApproved ? "Ready" : "Needs review"
                      },
                      void 0,
                      false,
                      {
                        fileName: "<stdin>",
                        lineNumber: 1103,
                        columnNumber: 25
                      },
                      this
                    ),
                    /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white", children: /* @__PURE__ */ jsxDEV(
                      "h4",
                      {
                        className: "text-sm font-bold truncate",
                        style: { fontFamily: post.designFont || currentBiz.headingFont },
                        children: photoEnglishText(post.headline || post.title)
                      },
                      void 0,
                      false,
                      {
                        fileName: "<stdin>",
                        lineNumber: 1114,
                        columnNumber: 27
                      },
                      this
                    ) }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1113,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1097,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "p-4 flex-1 flex flex-col justify-between", children: [
                    /* @__PURE__ */ jsxDEV("div", { children: [
                      /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#493f38] line-clamp-2 leading-relaxed", children: post.caption }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 1126,
                        columnNumber: 27
                      }, this),
                      /* @__PURE__ */ jsxDEV("div", { className: "mt-2.5 flex items-center gap-2 text-[10px] text-[#85867c]", children: [
                        /* @__PURE__ */ jsxDEV("span", { children: [
                          "Font: ",
                          post.designFont || currentBiz.headingFont
                        ] }, void 0, true, {
                          fileName: "<stdin>",
                          lineNumber: 1128,
                          columnNumber: 29
                        }, this),
                        /* @__PURE__ */ jsxDEV("span", { children: "\u2022" }, void 0, false, {
                          fileName: "<stdin>",
                          lineNumber: 1129,
                          columnNumber: 29
                        }, this),
                        /* @__PURE__ */ jsxDEV("span", { children: post.time }, void 0, false, {
                          fileName: "<stdin>",
                          lineNumber: 1130,
                          columnNumber: 29
                        }, this)
                      ] }, void 0, true, {
                        fileName: "<stdin>",
                        lineNumber: 1127,
                        columnNumber: 27
                      }, this)
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 1125,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV("div", { className: "mt-4 pt-3 border-t border-[#f0ece4] flex items-center justify-between gap-2", children: [
                      /* @__PURE__ */ jsxDEV(
                        "button",
                        {
                          onClick: () => setAdjustingPost(post),
                          className: "px-3 py-1.5 rounded-lg bg-[#f1e194] text-[#5b0e14] text-xs font-bold hover:bg-[#fff2ab] transition-colors flex items-center gap-1.5 shadow-xs",
                          children: [
                            /* @__PURE__ */ jsxDEV(Sliders, { className: "w-3.5 h-3.5" }, void 0, false, {
                              fileName: "<stdin>",
                              lineNumber: 1140,
                              columnNumber: 29
                            }, this),
                            /* @__PURE__ */ jsxDEV("span", { children: "Edit Photo" }, void 0, false, {
                              fileName: "<stdin>",
                              lineNumber: 1141,
                              columnNumber: 29
                            }, this)
                          ]
                        },
                        void 0,
                        true,
                        {
                          fileName: "<stdin>",
                          lineNumber: 1136,
                          columnNumber: 27
                        },
                        this
                      ),
                      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1.5", children: [
                        /* @__PURE__ */ jsxDEV(
                          "button",
                          {
                            onClick: () => setReviewingPost(post),
                            className: "px-2.5 py-1.5 rounded-lg border border-[#ded8cc] bg-white text-xs font-medium text-[#493f38] hover:bg-[#f4efe4] transition-colors",
                            children: "Review"
                          },
                          void 0,
                          false,
                          {
                            fileName: "<stdin>",
                            lineNumber: 1145,
                            columnNumber: 29
                          },
                          this
                        ),
                        /* @__PURE__ */ jsxDEV(
                          "button",
                          {
                            onClick: () => handleDownloadPost(post),
                            className: "p-1.5 rounded-lg border border-[#ded8cc] bg-white text-[#493f38] hover:bg-[#f4efe4] transition-colors",
                            title: "Download artwork",
                            children: /* @__PURE__ */ jsxDEV(Download, { className: "w-3.5 h-3.5" }, void 0, false, {
                              fileName: "<stdin>",
                              lineNumber: 1156,
                              columnNumber: 31
                            }, this)
                          },
                          void 0,
                          false,
                          {
                            fileName: "<stdin>",
                            lineNumber: 1151,
                            columnNumber: 29
                          },
                          this
                        )
                      ] }, void 0, true, {
                        fileName: "<stdin>",
                        lineNumber: 1144,
                        columnNumber: 27
                      }, this)
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 1135,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1124,
                    columnNumber: 23
                  }, this)
                ]
              },
              post.id,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 1092,
                columnNumber: 21
              },
              this
            )) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1090,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1073,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 927,
          columnNumber: 13
        }, this),
        currentView === "businesses" && /* @__PURE__ */ jsxDEV("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between pb-2 border-b border-[#e8e2d8]", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("h1", { className: "text-2xl font-extrabold text-[#1d211b]", children: "Business Subaccounts" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1173,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f]", children: "Each business maintains its own brand identity, typography, photo repository, and bot workflow." }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1174,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1172,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => setIsAddBizOpen(true),
                className: "px-4 py-2 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] shadow-md transition-colors flex items-center gap-1.5",
                children: [
                  /* @__PURE__ */ jsxDEV(Plus, { className: "w-4 h-4 text-[#f1e194]" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1182,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { children: "Add Business" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1183,
                    columnNumber: 19
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 1178,
                columnNumber: 17
              },
              this
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1171,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5", children: businesses.map((biz) => {
            const bPosts = posts.filter((p) => p.businessId === biz.id);
            const isCurrent = biz.id === currentBiz.id;
            return /* @__PURE__ */ jsxDEV(
              "div",
              {
                className: `p-6 rounded-2xl border transition-all bg-white shadow-sm flex flex-col justify-between ${isCurrent ? "border-[#5b0e14] ring-2 ring-[#5b0e14]/10 shadow-md" : "border-[#e8e2d8]"}`,
                children: [
                  /* @__PURE__ */ jsxDEV("div", { children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3 mb-4", children: [
                      /* @__PURE__ */ jsxDEV("div", { className: "w-10 h-10 rounded-xl bg-[#5b0e14] text-[#f1e194] flex items-center justify-center font-extrabold text-base shadow-sm overflow-hidden", children: biz.logoUrl ? /* @__PURE__ */ jsxDEV("img", { src: biz.logoUrl, alt: `${biz.name} logo`, className: "w-full h-full object-contain bg-white" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 1201,
                        columnNumber: 44
                      }, this) : biz.initial }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 1200,
                        columnNumber: 27
                      }, this),
                      /* @__PURE__ */ jsxDEV("div", { children: [
                        /* @__PURE__ */ jsxDEV("h3", { className: "text-base font-bold text-[#1d211b]", children: biz.name }, void 0, false, {
                          fileName: "<stdin>",
                          lineNumber: 1204,
                          columnNumber: 29
                        }, this),
                        /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f]", children: biz.industry }, void 0, false, {
                          fileName: "<stdin>",
                          lineNumber: 1205,
                          columnNumber: 29
                        }, this)
                      ] }, void 0, true, {
                        fileName: "<stdin>",
                        lineNumber: 1203,
                        columnNumber: 27
                      }, this)
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 1199,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#493f38] leading-relaxed mb-4", children: biz.description }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1209,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] font-semibold mb-3", style: { color: biz.businessProfile?.verified ? "#527247" : "#a55c2a" }, children: biz.businessProfile?.verified ? "Owner-verified profile" : "Profile facts not verified" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1210,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV("div", { className: "space-y-1.5 text-[11px] text-[#73796f] bg-[#faf8f2] p-3 rounded-xl border border-[#ece8df]", children: [
                      /* @__PURE__ */ jsxDEV("div", { children: [
                        /* @__PURE__ */ jsxDEV("strong", { className: "text-[#1d211b]", children: "Tone:" }, void 0, false, {
                          fileName: "<stdin>",
                          lineNumber: 1214,
                          columnNumber: 29
                        }, this),
                        " ",
                        biz.tone
                      ] }, void 0, true, {
                        fileName: "<stdin>",
                        lineNumber: 1213,
                        columnNumber: 27
                      }, this),
                      /* @__PURE__ */ jsxDEV("div", { children: [
                        /* @__PURE__ */ jsxDEV("strong", { className: "text-[#1d211b]", children: "Typography:" }, void 0, false, {
                          fileName: "<stdin>",
                          lineNumber: 1217,
                          columnNumber: 29
                        }, this),
                        " ",
                        biz.headingFont,
                        " / ",
                        biz.bodyFont
                      ] }, void 0, true, {
                        fileName: "<stdin>",
                        lineNumber: 1216,
                        columnNumber: 27
                      }, this),
                      biz.websiteUrl && /* @__PURE__ */ jsxDEV("div", { children: [
                        /* @__PURE__ */ jsxDEV("strong", { className: "text-[#1d211b]", children: "Website:" }, void 0, false, {
                          fileName: "<stdin>",
                          lineNumber: 1221,
                          columnNumber: 31
                        }, this),
                        " ",
                        /* @__PURE__ */ jsxDEV(
                          "a",
                          {
                            href: biz.websiteUrl,
                            target: "_blank",
                            rel: "noreferrer",
                            className: "text-[#2872a1] hover:underline",
                            children: biz.websiteUrl
                          },
                          void 0,
                          false,
                          {
                            fileName: "<stdin>",
                            lineNumber: 1222,
                            columnNumber: 31
                          },
                          this
                        )
                      ] }, void 0, true, {
                        fileName: "<stdin>",
                        lineNumber: 1220,
                        columnNumber: 29
                      }, this)
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 1212,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1198,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "mt-5 pt-4 border-t border-[#f0ece4] flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxDEV("span", { className: "text-xs text-[#85867c] font-medium", children: [
                      bPosts.length,
                      " post drafts"
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 1236,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxDEV("button", { onClick: () => {
                        setEditingBusiness(biz);
                        setIsAddBizOpen(true);
                      }, className: "px-3 py-1.5 rounded-lg border border-[#ded8cc] bg-white text-xs font-semibold text-[#493f38]", children: "Edit profile" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 1239,
                        columnNumber: 27
                      }, this),
                      /* @__PURE__ */ jsxDEV(
                        "button",
                        {
                          onClick: () => {
                            setCurrentBizId(biz.id);
                            setCurrentView("overview");
                          },
                          className: `px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${isCurrent ? "bg-[#5b0e14] text-[#fff8ed]" : "bg-[#faf8f2] text-[#493f38] hover:bg-[#f2ece1] border border-[#ded8cc]"}`,
                          children: isCurrent ? "Active Workspace" : "Select"
                        },
                        void 0,
                        false,
                        {
                          fileName: "<stdin>",
                          lineNumber: 1240,
                          columnNumber: 27
                        },
                        this
                      )
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 1238,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1235,
                    columnNumber: 23
                  }, this)
                ]
              },
              biz.id,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 1192,
                columnNumber: 21
              },
              this
            );
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1187,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1170,
          columnNumber: 13
        }, this),
        currentView === "studio" && /* @__PURE__ */ jsxDEV("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e8e2d8]", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("h1", { className: "text-2xl font-extrabold text-[#1d211b]", children: "Creative Studio" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1267,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f]", children: [
                "Curated brand palette, typography, catalog scouting, and photo adjuster for ",
                currentBiz.name,
                "."
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1268,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1266,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => setCatalogSearchPost(businessPosts[0] || null),
                  className: "px-3.5 py-2 rounded-xl border border-[#ded8cc] bg-white text-xs font-semibold text-[#493f38] hover:bg-[#f4efe4] transition-colors flex items-center gap-1.5 shadow-xs",
                  children: [
                    /* @__PURE__ */ jsxDEV(Search, { className: "w-3.5 h-3.5 text-[#5b0e14]" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1278,
                      columnNumber: 21
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { children: "Search Public Catalogs" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1279,
                      columnNumber: 21
                    }, this)
                  ]
                },
                void 0,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 1274,
                  columnNumber: 19
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => {
                    if (businessPosts[0]) setAdjustingPost(businessPosts[0]);
                    else showToast("Create a post first to launch the photo adjuster");
                  },
                  className: "px-4 py-2 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] shadow-md transition-colors flex items-center gap-1.5",
                  children: [
                    /* @__PURE__ */ jsxDEV(Sliders, { className: "w-4 h-4 text-[#f1e194]" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1289,
                      columnNumber: 21
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { children: "Launch Photo Adjuster Studio" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1290,
                      columnNumber: 21
                    }, this)
                  ]
                },
                void 0,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 1282,
                  columnNumber: 19
                },
                this
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1273,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1265,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "p-5 rounded-2xl bg-white border border-[#e8e2d8] shadow-sm", children: [
            /* @__PURE__ */ jsxDEV("h3", { className: "text-sm font-bold text-[#1d211b] mb-1", children: [
              "Active Brand Palette & Typography (",
              currentBiz.name,
              ")"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1297,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f] mb-4", children: [
              "Heading: ",
              /* @__PURE__ */ jsxDEV("span", { style: { fontFamily: currentBiz.headingFont }, children: currentBiz.headingFont }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1301,
                columnNumber: 28
              }, this),
              " \xB7 Body:",
              " ",
              currentBiz.bodyFont
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1300,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap gap-4", children: (currentBiz.websiteInsights?.colors || ["#5B0E14", "#F1E194", "#2C1810", "#EFE9DE"]).map(
              (color, i) => /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2.5 p-2 rounded-xl border border-[#ece8df] bg-[#faf8f2]", children: [
                /* @__PURE__ */ jsxDEV(
                  "div",
                  {
                    className: "w-8 h-8 rounded-lg shadow-inner border border-black/10",
                    style: { backgroundColor: color }
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 1309,
                    columnNumber: 25
                  },
                  this
                ),
                /* @__PURE__ */ jsxDEV("div", { children: [
                  /* @__PURE__ */ jsxDEV("strong", { className: "block text-xs font-mono", children: color }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1314,
                    columnNumber: 27
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-[#85867c] capitalize", children: i === 0 ? "Primary" : i === 1 ? "Accent" : `Tone ${i + 1}` }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1315,
                    columnNumber: 27
                  }, this)
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1313,
                  columnNumber: 25
                }, this)
              ] }, i, true, {
                fileName: "<stdin>",
                lineNumber: 1308,
                columnNumber: 23
              }, this)
            ) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1305,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "mt-5 pt-4 border-t border-[#f0ece4]", children: [
              /* @__PURE__ */ jsxDEV("h4", { className: "text-xs font-bold text-[#493f38] mb-3", children: "Egyptian business palettes \xB7 choose a paired accent" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1324,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2", children: creativePalettes.map((palette) => /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => {
                    const updatedBusinesses = businesses.map((business) => business.id === currentBiz.id ? { ...business, websiteInsights: { ...business.websiteInsights, colors: [...palette.colors] } } : business);
                    setBusinesses(updatedBusinesses);
                    fetch("/api/crm/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businesses: updatedBusinesses }) }).catch(console.warn);
                    showToast(`${palette.name}: ${palette.colors.join(" + ")}`);
                  },
                  className: "flex items-center gap-3 rounded-xl border border-[#ece8df] bg-[#faf8f2] px-3 py-2 text-left hover:border-[#cfc5b5]",
                  children: [
                    /* @__PURE__ */ jsxDEV("span", { className: "flex overflow-hidden rounded-lg border border-black/10", children: palette.colors.map((color) => /* @__PURE__ */ jsxDEV("i", { className: "w-5 h-8", style: { backgroundColor: color } }, color, false, {
                      fileName: "<stdin>",
                      lineNumber: 1340,
                      columnNumber: 58
                    }, this)) }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1339,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { children: [
                      /* @__PURE__ */ jsxDEV("strong", { className: "block text-[11px]", children: palette.name }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 1342,
                        columnNumber: 31
                      }, this),
                      /* @__PURE__ */ jsxDEV("small", { className: "font-mono text-[9px] text-[#73796f]", children: palette.colors.join(" \xB7 ") }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 1342,
                        columnNumber: 92
                      }, this)
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 1342,
                      columnNumber: 25
                    }, this)
                  ]
                },
                palette.name,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 1327,
                  columnNumber: 23
                },
                this
              )) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1325,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1323,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1296,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("h3", { className: "text-base font-bold text-[#1d211b] mb-3", children: "Live Photographic Concepts" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1351,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5", children: businessPosts.map((post) => /* @__PURE__ */ jsxDEV(
              "div",
              {
                className: "rounded-2xl border border-[#e8e2d8] overflow-hidden bg-white shadow-sm flex flex-col group",
                children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "aspect-square bg-[#211a19] relative overflow-hidden", children: [
                    post.imageUrl ? /* @__PURE__ */ jsxDEV("img", { src: post.imageUrl, alt: post.title, referrerPolicy: "no-referrer", className: "w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1359,
                      columnNumber: 42
                    }, this) : /* @__PURE__ */ jsxDEV("div", { className: "w-full h-full flex items-center justify-center bg-gradient-to-br from-[#332b29] to-[#5b0e14] text-xs font-semibold text-white/80", children: [
                      "Photo needed \xB7 ",
                      currentBiz.industry
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 1359,
                      columnNumber: 213
                    }, this),
                    /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white", children: [
                      /* @__PURE__ */ jsxDEV(
                        "h4",
                        {
                          className: "text-base font-bold leading-tight",
                          style: { fontFamily: post.designFont || currentBiz.headingFont },
                          children: photoEnglishText(post.headline || post.title)
                        },
                        void 0,
                        false,
                        {
                          fileName: "<stdin>",
                          lineNumber: 1361,
                          columnNumber: 27
                        },
                        this
                      ),
                      /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-[#f1e194]", children: photoEnglishText(post.sub || currentBiz.name) }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 1367,
                        columnNumber: 27
                      }, this)
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 1360,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1358,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "p-3.5 bg-white border-t border-[#f0ece4] flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxDEV("span", { className: "text-xs text-[#73796f]", children: [
                      post.platform,
                      " format"
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 1372,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV(
                      "button",
                      {
                        onClick: () => setAdjustingPost(post),
                        className: "px-3 py-1.5 rounded-lg bg-[#f1e194] text-[#5b0e14] text-xs font-bold hover:bg-[#fff2ab] transition-colors flex items-center gap-1 shadow-xs",
                        children: [
                          /* @__PURE__ */ jsxDEV(Sliders, { className: "w-3.5 h-3.5" }, void 0, false, {
                            fileName: "<stdin>",
                            lineNumber: 1377,
                            columnNumber: 27
                          }, this),
                          /* @__PURE__ */ jsxDEV("span", { children: "Edit Photo" }, void 0, false, {
                            fileName: "<stdin>",
                            lineNumber: 1378,
                            columnNumber: 27
                          }, this)
                        ]
                      },
                      void 0,
                      true,
                      {
                        fileName: "<stdin>",
                        lineNumber: 1373,
                        columnNumber: 25
                      },
                      this
                    )
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1371,
                    columnNumber: 23
                  }, this)
                ]
              },
              post.id,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 1354,
                columnNumber: 21
              },
              this
            )) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1352,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1350,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1264,
          columnNumber: 13
        }, this),
        currentView === "content" && /* @__PURE__ */ jsxDEV("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e8e2d8]", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("h1", { className: "text-2xl font-extrabold text-[#1d211b]", children: "Content Calendar" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1393,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f]", children: "Weekly schedule & publication pipeline across Instagram, Facebook, TikTok, and LinkedIn." }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1394,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1392,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: handleRunWorkflow,
                disabled: isRunningWorkflow || !workflowReady,
                className: "px-4 py-2 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50",
                children: [
                  /* @__PURE__ */ jsxDEV(Sparkles, { className: "w-4 h-4 text-[#f1e194]" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1403,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { children: `Run Batch ${workflowBatchNumber} \xB7 ${workflowBatchSize} posts` }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1404,
                    columnNumber: 19
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 1398,
                columnNumber: 17
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: handleDownloadCampaign,
                disabled: isBundleDownloading || !businessPosts.length,
                className: "px-4 py-2 rounded-xl border border-[#ded8cc] bg-white text-[#493f38] text-xs font-bold hover:bg-[#f4efe4] transition-colors flex items-center gap-1.5 disabled:opacity-50",
                title: "Download all campaign artwork and captions in one ZIP",
                children: [
                  /* @__PURE__ */ jsxDEV(Download, { className: "w-4 h-4 text-[#5b0e14]" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1412,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { children: bundleProgress || (isBundleDownloading ? "Building ZIP\u2026" : "Download All") }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1413,
                    columnNumber: 19
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 1406,
                columnNumber: 17
              },
              this
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1391,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5", children: businessPosts.map((post) => /* @__PURE__ */ jsxDEV(
            "div",
            {
              className: "rounded-2xl border border-[#e8e2d8] overflow-hidden bg-white shadow-sm flex flex-col group hover:shadow-md transition-all",
              children: [
                /* @__PURE__ */ jsxDEV("div", { className: "aspect-[4/3] bg-[#211a19] relative overflow-hidden", children: [
                  post.imageUrl ? /* @__PURE__ */ jsxDEV("img", { src: post.imageUrl, alt: post.title, referrerPolicy: "no-referrer", className: "w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1424,
                    columnNumber: 40
                  }, this) : /* @__PURE__ */ jsxDEV("div", { className: "w-full h-full flex items-center justify-center bg-gradient-to-br from-[#332b29] to-[#5b0e14] text-xs font-semibold text-white/80", children: [
                    "Photo needed \xB7 ",
                    currentBiz.industry
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1424,
                    columnNumber: 211
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 text-[#f1e194] backdrop-blur-xs", children: post.platform }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1425,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#faf8f2] text-[#493f38]", children: post.time }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1428,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1423,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "p-4 flex-1 flex flex-col justify-between", children: [
                  /* @__PURE__ */ jsxDEV("div", { children: [
                    /* @__PURE__ */ jsxDEV(
                      "h4",
                      {
                        className: "text-sm font-bold text-[#1d211b] mb-1",
                        style: { fontFamily: post.designFont || currentBiz.headingFont },
                        children: post.title
                      },
                      void 0,
                      false,
                      {
                        fileName: "<stdin>",
                        lineNumber: 1435,
                        columnNumber: 25
                      },
                      this
                    ),
                    /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f] line-clamp-3 leading-relaxed", children: post.caption }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1441,
                      columnNumber: 25
                    }, this),
                    post.engineerReview && /* @__PURE__ */ jsxDEV("p", { className: `mt-2 text-[10px] font-semibold ${post.engineerReview.content === "approved" && post.engineerReview.visual === "approved" ? "text-[#527247]" : "text-[#a34e42]"}`, children: [
                      "Engineer QA \xB7 copy ",
                      post.engineerReview.content,
                      " \xB7 visual ",
                      post.engineerReview.visual,
                      " \xB7 ",
                      post.researchSources?.length || 0,
                      " research sources"
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 1442,
                      columnNumber: 49
                    }, this)
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1434,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "mt-4 pt-3 border-t border-[#f0ece4] flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxDEV(
                      "button",
                      {
                        onClick: () => setAdjustingPost(post),
                        className: "px-3 py-1.5 rounded-lg bg-[#f1e194] text-[#5b0e14] text-xs font-bold hover:bg-[#fff2ab] transition-colors flex items-center gap-1 shadow-xs",
                        children: [
                          /* @__PURE__ */ jsxDEV(Sliders, { className: "w-3.5 h-3.5" }, void 0, false, {
                            fileName: "<stdin>",
                            lineNumber: 1450,
                            columnNumber: 27
                          }, this),
                          /* @__PURE__ */ jsxDEV("span", { children: "Edit Photo" }, void 0, false, {
                            fileName: "<stdin>",
                            lineNumber: 1451,
                            columnNumber: 27
                          }, this)
                        ]
                      },
                      void 0,
                      true,
                      {
                        fileName: "<stdin>",
                        lineNumber: 1446,
                        columnNumber: 25
                      },
                      this
                    ),
                    /* @__PURE__ */ jsxDEV(
                      "button",
                      {
                        onClick: () => setReviewingPost(post),
                        className: "px-3 py-1.5 rounded-lg bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] transition-colors flex items-center gap-1",
                        children: [
                          /* @__PURE__ */ jsxDEV(Eye, { className: "w-3.5 h-3.5" }, void 0, false, {
                            fileName: "<stdin>",
                            lineNumber: 1458,
                            columnNumber: 27
                          }, this),
                          /* @__PURE__ */ jsxDEV("span", { children: "Review" }, void 0, false, {
                            fileName: "<stdin>",
                            lineNumber: 1459,
                            columnNumber: 27
                          }, this)
                        ]
                      },
                      void 0,
                      true,
                      {
                        fileName: "<stdin>",
                        lineNumber: 1454,
                        columnNumber: 25
                      },
                      this
                    )
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1445,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1433,
                  columnNumber: 21
                }, this)
              ]
            },
            post.id,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 1419,
              columnNumber: 19
            },
            this
          )) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1417,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1390,
          columnNumber: 13
        }, this),
        currentView === "workflows" && /* @__PURE__ */ jsxDEV("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e8e2d8]", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("h1", { className: "text-2xl font-extrabold text-[#1d211b]", children: "Workflows" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1474,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f]", children: [
                "Configure batch creation, platform targets, and bot quality rules for ",
                currentBiz.name,
                "."
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1475,
                columnNumber: 19
              }, this),
              !workflowReady && /* @__PURE__ */ jsxDEV("p", { className: "mt-2 text-xs font-semibold text-[#a34e42]", children: "Niche research, writing, engineer copy and visual review, photo sourcing, and owner handoff are required for every run." }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1478,
                columnNumber: 38
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1473,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: handleRunWorkflow,
                disabled: isRunningWorkflow || !workflowReady,
                className: "px-5 py-2.5 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] shadow-md transition-colors flex items-center gap-1.5",
                children: [
                  /* @__PURE__ */ jsxDEV(Sparkles, { className: "w-4 h-4 text-[#f1e194]" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1486,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { children: [
                    "Run ",
                    currentBiz.name,
                    " Workflow"
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1487,
                    columnNumber: 19
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 1481,
                columnNumber: 17
              },
              this
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1472,
            columnNumber: 15
          }, this),
          currentWorkflowRun && /* @__PURE__ */ jsxDEV("div", { className: "p-5 rounded-2xl bg-white border border-[#e8e2d8] shadow-sm", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-center justify-between gap-2 mb-3", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("strong", { className: "text-sm", children: isRunningWorkflow ? "Live workflow activity" : "Last workflow activity" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1494,
                  columnNumber: 26
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f] mt-1", children: [
                  currentWorkflowRun.completed,
                  "/",
                  currentWorkflowRun.total,
                  " posts saved",
                  currentWorkflowRun.prepared ? ` \xB7 ${currentWorkflowRun.prepared} copy drafts prepared` : "",
                  " \xB7 ",
                  Math.floor(workflowElapsed / 60),
                  ":",
                  String(workflowElapsed % 60).padStart(2, "0"),
                  " elapsed \xB7 ",
                  currentWorkflowRun.activeStep
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1494,
                  columnNumber: 136
                }, this)
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1494,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-bold text-[#5b0e14]", children: [
                currentWorkflowRun.stageProgress ?? Math.round(currentWorkflowRun.completed / currentWorkflowRun.total * 100),
                "%"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1495,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1493,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "h-2 rounded-full bg-[#f0ece4] overflow-hidden mb-4", children: /* @__PURE__ */ jsxDEV("div", { className: "h-full bg-[#5b0e14] transition-all", style: { width: `${Math.min(100, currentWorkflowRun.stageProgress ?? currentWorkflowRun.completed / currentWorkflowRun.total * 100)}%` } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1497,
              columnNumber: 87
            }, this) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1497,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2", children: botDefs.map((bot) => {
              const task = currentWorkflowRun.botTimes[bot.id] || { elapsedMs: 0, state: "Skipped", step: "" };
              const ms = task.elapsedMs + (task.startedAt ? Date.now() - task.startedAt : 0);
              return /* @__PURE__ */ jsxDEV("div", { className: "p-3 rounded-xl bg-[#faf8f2] border border-[#ece8df]", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between gap-2", children: [
                  /* @__PURE__ */ jsxDEV("strong", { className: "text-[11px]", children: bot.name }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1502,
                    columnNumber: 156
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-semibold text-[#527247]", children: [
                    task.state,
                    " \xB7 ",
                    Math.floor(ms / 6e4),
                    ":",
                    String(Math.floor(ms / 1e3) % 60).padStart(2, "0")
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1502,
                    columnNumber: 207
                  }, this)
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1502,
                  columnNumber: 112
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-[#73796f] mt-1 min-h-3", children: task.step || "Waiting for its workflow stage" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1502,
                  columnNumber: 372
                }, this)
              ] }, bot.id, true, {
                fileName: "<stdin>",
                lineNumber: 1502,
                columnNumber: 30
              }, this);
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1498,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1492,
            columnNumber: 17
          }, this),
          currentWorkflow.lastRun && !currentWorkflowRun && /* @__PURE__ */ jsxDEV("div", { className: `p-5 rounded-2xl border shadow-sm ${currentWorkflow.lastRun.status === "complete" ? "bg-[#f5f8f1] border-[#dce7d3]" : "bg-[#fff8ed] border-[#eadfc9]"}`, children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("strong", { className: "text-sm", children: [
                  "Engineer supervision \xB7 ",
                  currentWorkflow.lastRun.status.replace("_", " ")
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1510,
                  columnNumber: 90
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#625c51] mt-1", children: [
                  currentWorkflow.lastRun.generated,
                  "/",
                  currentWorkflow.lastRun.target,
                  " drafts \xB7 ",
                  currentWorkflow.lastRun.activeStep
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1510,
                  columnNumber: 200
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#625c51] mt-2", children: currentWorkflow.lastRun.note }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1510,
                  columnNumber: 361
                }, this)
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1510,
                columnNumber: 85
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-semibold text-[#73796f]", children: new Date(currentWorkflow.lastRun.startedAt).toLocaleString() }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1510,
                columnNumber: 444
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1510,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4", children: botDefs.map((bot) => {
              const state = currentWorkflow.lastRun?.botStates?.[bot.id] || { status: "No recorded work", detail: "No task has been recorded for this bot yet.", elapsedMs: 0 };
              return /* @__PURE__ */ jsxDEV("div", { className: "p-3 rounded-xl bg-white/80 border border-[#ece8df]", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between gap-2", children: [
                  /* @__PURE__ */ jsxDEV("strong", { className: "text-[11px]", children: bot.name }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1511,
                    columnNumber: 413
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold", children: state.status }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1511,
                    columnNumber: 464
                  }, this)
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1511,
                  columnNumber: 369
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-[#73796f] mt-1", children: state.detail }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1511,
                  columnNumber: 531
                }, this),
                /* @__PURE__ */ jsxDEV("small", { className: "text-[10px] text-[#85867c]", children: [
                  Math.floor(state.elapsedMs / 6e4),
                  ":",
                  String(Math.floor(state.elapsedMs / 1e3) % 60).padStart(2, "0"),
                  " active time"
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1511,
                  columnNumber: 596
                }, this)
              ] }, bot.id, true, {
                fileName: "<stdin>",
                lineNumber: 1511,
                columnNumber: 288
              }, this);
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1511,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1509,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "p-6 rounded-2xl bg-white border border-[#e8e2d8] shadow-sm space-y-4", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Workflow Name" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1517,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "text",
                  value: currentWorkflow.name,
                  onChange: (e) => {
                    const updated = { ...currentWorkflow, name: e.target.value };
                    setWorkflows((prev) => prev.map((w) => w.id === currentWorkflow.id ? updated : w));
                  },
                  className: "w-full px-3.5 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white font-semibold"
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 1520,
                  columnNumber: 19
                },
                this
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1516,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Total Post Target (10\u2013100; batches of 10)" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1533,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "number",
                    min: 10,
                    max: 100,
                    step: 10,
                    value: currentWorkflow.postsPerRun,
                    onChange: (e) => {
                      const updated = { ...currentWorkflow, postsPerRun: Math.max(10, Math.min(100, Math.round((Number(e.target.value) || 100) / 10) * 10)) };
                      setWorkflows((prev) => prev.map((w) => w.id === currentWorkflow.id ? updated : w));
                    },
                    className: "w-full px-3.5 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white font-semibold"
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 1536,
                    columnNumber: 21
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1532,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Daily Goal" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1551,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "number",
                    min: 1,
                    max: 1e3,
                    value: currentWorkflow.dailyGoal || 100,
                    onChange: (e) => {
                      const updated = { ...currentWorkflow, dailyGoal: Math.max(1, Math.min(1e3, Number(e.target.value) || 100)) };
                      setWorkflows((prev) => prev.map((w) => w.id === currentWorkflow.id ? updated : w));
                    },
                    className: "w-full px-3.5 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white font-semibold"
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 1554,
                    columnNumber: 21
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1550,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1531,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Posting Time Slots (24-hour, comma separated)" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1563,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("input", { type: "text", value: (currentWorkflow.postingTimes || ["09:00", "11:30", "14:00", "16:30", "18:00", "20:00"]).join(", "), onChange: (e) => {
                const updated = { ...currentWorkflow, postingTimes: e.target.value.split(",").map((time) => time.trim()).filter((time) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time)) };
                setWorkflows((prev) => prev.map((w) => w.id === currentWorkflow.id ? updated : w));
              }, className: "w-full px-3.5 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1564,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1562,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Publishing Channels (comma separated)" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1569,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("input", { type: "text", value: (currentWorkflow.channels || []).join(", "), onChange: (e) => {
                  const updated = { ...currentWorkflow, channels: e.target.value.split(",").map((channel) => channel.trim()).filter(Boolean) };
                  setWorkflows((prev) => prev.map((w) => w.id === currentWorkflow.id ? updated : w));
                }, className: "w-full px-3.5 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1570,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1568,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider", children: [
                  "Post Languages",
                  /* @__PURE__ */ jsxDEV("select", { value: "Mixed", disabled: true, className: "mt-1 w-full px-3 py-2 rounded-xl border border-[#ded8cc] bg-[#f0ece4] text-xs normal-case", children: /* @__PURE__ */ jsxDEV("option", { value: "Mixed", children: "English + Arabic in every post" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1573,
                    columnNumber: 245
                  }, this) }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1573,
                    columnNumber: 112
                  }, this)
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1573,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider", children: [
                  "Photo Source",
                  /* @__PURE__ */ jsxDEV("select", { value: currentWorkflow.imageMode || "catalog-first", onChange: (e) => {
                    const updated = { ...currentWorkflow, imageMode: e.target.value };
                    setWorkflows((prev) => prev.map((w) => w.id === currentWorkflow.id ? updated : w));
                  }, className: "mt-1 w-full px-3 py-2 rounded-xl border border-[#ded8cc] bg-white text-xs normal-case", children: [
                    /* @__PURE__ */ jsxDEV("option", { value: "catalog-first", children: "Catalog first" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1574,
                      columnNumber: 467
                    }, this),
                    /* @__PURE__ */ jsxDEV("option", { value: "ai-first", children: "AI generated first" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1574,
                      columnNumber: 519
                    }, this)
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1574,
                    columnNumber: 110
                  }, this)
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1574,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1572,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1567,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Content Mix" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1579,
                  columnNumber: 24
                }, this),
                /* @__PURE__ */ jsxDEV("textarea", { rows: 2, value: currentWorkflow.contentMix || "", onChange: (e) => {
                  const updated = { ...currentWorkflow, contentMix: e.target.value };
                  setWorkflows((prev) => prev.map((w) => w.id === currentWorkflow.id ? updated : w));
                }, className: "w-full p-3 text-xs rounded-xl border border-[#ded8cc] bg-white" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1579,
                  columnNumber: 131
                }, this)
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1579,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("label", { className: "flex items-center gap-2 text-xs font-semibold text-[#493f38] p-3 rounded-xl border border-[#ece8df] bg-[#faf8f2]", children: [
                /* @__PURE__ */ jsxDEV("input", { type: "checkbox", checked: currentWorkflow.researchEnabled !== false, disabled: true, onChange: (e) => {
                  const updated = { ...currentWorkflow, researchEnabled: e.target.checked };
                  setWorkflows((prev) => prev.map((w) => w.id === currentWorkflow.id ? updated : w));
                } }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1580,
                  columnNumber: 151
                }, this),
                "Research this business niche before every batch; required for engineer sign-off"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1580,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1578,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Workflow Instructions & Rules" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1584,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV(
                "textarea",
                {
                  rows: 4,
                  value: currentWorkflow.instructions,
                  onChange: (e) => {
                    const updated = { ...currentWorkflow, instructions: e.target.value };
                    setWorkflows((prev) => prev.map((w) => w.id === currentWorkflow.id ? updated : w));
                  },
                  className: "w-full p-3.5 text-xs rounded-xl border border-[#ded8cc] bg-white leading-relaxed"
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 1587,
                  columnNumber: 19
                },
                this
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1583,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "pt-2 border-t border-[#ece8df] space-y-3", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsxDEV("div", { children: [
                  /* @__PURE__ */ jsxDEV("h2", { className: "text-sm font-extrabold text-[#1d211b]", children: "Automation builder" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1600,
                    columnNumber: 26
                  }, this),
                  /* @__PURE__ */ jsxDEV("p", { className: "text-[11px] text-[#73796f] mt-1", children: "Edit bot ownership and rules. Production handoffs stay dependency-safe; custom instructions run with their assigned bot." }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1600,
                    columnNumber: 103
                  }, this)
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1600,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("button", { onClick: () => updateCurrentWorkflow({ steps: [...currentWorkflow.steps || defaultWorkflowSteps(), { id: `custom-${Date.now()}`, botId: "lead", name: "Custom review instruction", enabled: true, required: false, instructions: "Describe exactly what this bot should check or produce." }] }), className: "px-3 py-2 rounded-lg border border-[#ded8cc] bg-[#faf8f2] text-[11px] font-bold text-[#5b0e14]", children: "+ Add bot instruction" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1601,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1599,
                columnNumber: 19
              }, this),
              (currentWorkflow.steps || defaultWorkflowSteps()).map((step, index, allSteps) => {
                const coreStep = ["research", "writing", "copy-review", "art-direction", "image-search", "photo-edit", "owner-handoff"].includes(step.id);
                const lockedRole = ["research", "writing", "copy-review", "art-direction", "image-search", "photo-edit", "owner-handoff"].includes(step.id);
                return /* @__PURE__ */ jsxDEV("div", { className: `rounded-xl border p-4 space-y-3 ${step.enabled ? "border-[#e8e2d8] bg-white" : "border-[#ece8df] bg-[#faf8f2] opacity-75"}`, children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-center gap-2", children: [
                    /* @__PURE__ */ jsxDEV("span", { className: "w-7 h-7 rounded-lg bg-[#5b0e14] text-[#f1e194] grid place-items-center text-[10px] font-bold", children: index + 1 }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1608,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV("input", { value: step.name, onChange: (event) => updateWorkflowStep(step.id, { name: event.target.value }), className: "flex-1 min-w-[160px] px-3 py-2 rounded-lg border border-[#ded8cc] text-xs font-bold", "aria-label": "Automation name" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1609,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV("select", { value: step.botId, disabled: lockedRole, onChange: (event) => updateWorkflowStep(step.id, { botId: event.target.value }), className: "px-3 py-2 rounded-lg border border-[#ded8cc] bg-white text-xs disabled:bg-[#f0ece4]", "aria-label": "Assigned bot", children: botDefs.map((bot) => /* @__PURE__ */ jsxDEV("option", { value: bot.id, children: bot.name }, bot.id, false, {
                      fileName: "<stdin>",
                      lineNumber: 1610,
                      columnNumber: 299
                    }, this)) }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1610,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV("button", { disabled: !index || allSteps[index - 1].botId !== step.botId, onClick: () => {
                      const next = [...allSteps];
                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                      updateCurrentWorkflow({ steps: next });
                    }, className: "px-2 py-2 rounded-lg border border-[#ded8cc] text-xs disabled:opacity-30", "aria-label": "Change instruction priority for assigned bot", children: "\u2191" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1611,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV("button", { disabled: index === allSteps.length - 1 || allSteps[index + 1].botId !== step.botId, onClick: () => {
                      const next = [...allSteps];
                      [next[index + 1], next[index]] = [next[index], next[index + 1]];
                      updateCurrentWorkflow({ steps: next });
                    }, className: "px-2 py-2 rounded-lg border border-[#ded8cc] text-xs disabled:opacity-30", "aria-label": "Change instruction priority for assigned bot", children: "\u2193" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1612,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1607,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("textarea", { rows: 2, value: step.instructions, onChange: (event) => updateWorkflowStep(step.id, { instructions: event.target.value }), className: "w-full p-3 rounded-lg border border-[#ded8cc] text-xs leading-relaxed", "aria-label": `${step.name} instructions` }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1614,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "flex gap-4", children: [
                      /* @__PURE__ */ jsxDEV("label", { className: "flex items-center gap-2 text-[11px] font-semibold text-[#493f38]", children: [
                        /* @__PURE__ */ jsxDEV("input", { type: "checkbox", checked: step.enabled, disabled: coreStep, onChange: (event) => updateWorkflowStep(step.id, { enabled: event.target.checked }) }, void 0, false, {
                          fileName: "<stdin>",
                          lineNumber: 1617,
                          columnNumber: 111
                        }, this),
                        "Enabled",
                        coreStep && " \xB7 core handoff"
                      ] }, void 0, true, {
                        fileName: "<stdin>",
                        lineNumber: 1617,
                        columnNumber: 27
                      }, this),
                      /* @__PURE__ */ jsxDEV("label", { className: "flex items-center gap-2 text-[11px] font-semibold text-[#493f38]", children: [
                        /* @__PURE__ */ jsxDEV("input", { type: "checkbox", checked: coreStep || step.required, disabled: coreStep || !step.enabled, onChange: (event) => updateWorkflowStep(step.id, { required: event.target.checked }) }, void 0, false, {
                          fileName: "<stdin>",
                          lineNumber: 1618,
                          columnNumber: 111
                        }, this),
                        "Required for engineer sign-off"
                      ] }, void 0, true, {
                        fileName: "<stdin>",
                        lineNumber: 1618,
                        columnNumber: 27
                      }, this)
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 1616,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV("button", { disabled: coreStep, onClick: () => updateCurrentWorkflow({ steps: allSteps.filter((item) => item.id !== step.id) }), className: "text-[11px] font-bold text-[#a34e42] hover:underline disabled:opacity-35", children: "Remove step" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1620,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1615,
                    columnNumber: 23
                  }, this)
                ] }, step.id, true, {
                  fileName: "<stdin>",
                  lineNumber: 1606,
                  columnNumber: 28
                }, this);
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1598,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "pt-3 flex justify-end", children: /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: async () => {
                  const normalized = normalizeWorkflow({ ...currentWorkflow, revision: (currentWorkflow.revision || 0) + 1 });
                  const updated = workflows.some((workflow) => workflow.id === normalized.id) ? workflows.map((workflow) => workflow.id === normalized.id ? normalized : workflow) : [normalized, ...workflows];
                  setWorkflows(updated);
                  const response = await fetch("/api/crm/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workflows: updated }) });
                  showToast(response.ok ? "Workflow and bot automations saved." : "Could not save workflow changes. Try again.");
                },
                className: "px-4 py-2 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] transition-colors",
                children: "Save Changes"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 1627,
                columnNumber: 21
              },
              this
            ) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1626,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1515,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1471,
          columnNumber: 13
        }, this),
        currentView === "agents" && /* @__PURE__ */ jsxDEV("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e8e2d8]", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("h1", { className: "text-2xl font-extrabold text-[#1d211b]", children: "Bot Team & Task Queue" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1651,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f]", children: "6 specialized agents collaborating to scout, direct, adjust, and package marketing content." }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1652,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1650,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => setIsAssignTaskOpen(true),
                className: "px-4 py-2 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] shadow-md transition-colors flex items-center gap-1.5",
                children: [
                  /* @__PURE__ */ jsxDEV(Plus, { className: "w-4 h-4 text-[#f1e194]" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1661,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { children: "Assign Bot Task" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1662,
                    columnNumber: 19
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 1657,
                columnNumber: 17
              },
              this
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1649,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: `p-5 rounded-2xl border shadow-sm ${["needs_attention", "interrupted", "failed"].includes(currentWorkflow.lastRun?.status || "") ? "bg-[#fff5ee] border-[#eed5c2]" : "bg-white border-[#e8e2d8]"}`, children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxDEV(ShieldCheck, { className: "w-4 h-4 text-[#5b0e14]" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1667,
                    columnNumber: 130
                  }, this),
                  /* @__PURE__ */ jsxDEV("strong", { className: "text-sm text-[#1d211b]", children: "Engineer owner view" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1667,
                    columnNumber: 179
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "px-2 py-0.5 rounded-full bg-[#f1e194] text-[#5b0e14] text-[9px] font-extrabold uppercase", children: "Owner controls" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1667,
                    columnNumber: 250
                  }, this)
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1667,
                  columnNumber: 89
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f] mt-1", children: "Tracks every bot's handoff and leaves unfinished work visible." }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1667,
                  columnNumber: 384
                }, this)
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1667,
                columnNumber: 84
              }, this),
              /* @__PURE__ */ jsxDEV("button", { onClick: () => setCurrentView("workflows"), className: "px-3 py-2 rounded-lg border border-[#ded8cc] text-[11px] font-bold text-[#5b0e14]", children: "Edit all automations" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1667,
                columnNumber: 499
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1667,
              columnNumber: 17
            }, this),
            currentWorkflow.lastRun ? /* @__PURE__ */ jsxDEV("div", { className: "mt-4", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
                /* @__PURE__ */ jsxDEV("strong", { className: "text-xs", children: [
                  currentWorkflow.lastRun.status.replace("_", " "),
                  " \xB7 ",
                  currentWorkflow.lastRun.generated,
                  "/",
                  currentWorkflow.lastRun.target,
                  " drafts"
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1668,
                  columnNumber: 133
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-[#73796f]", children: [
                  "Started ",
                  new Date(currentWorkflow.lastRun.startedAt).toLocaleString()
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1668,
                  columnNumber: 298
                }, this)
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1668,
                columnNumber: 66
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#625c51] mt-1", children: currentWorkflow.lastRun.note || currentWorkflow.lastRun.activeStep }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1668,
                columnNumber: 426
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3", children: botDefs.map((bot) => {
                const state = currentWorkflow.lastRun?.botStates?.[bot.id] || { status: "No recorded work", detail: "No task recorded yet." };
                return /* @__PURE__ */ jsxDEV("div", { className: "p-3 rounded-xl bg-[#faf8f2] border border-[#ece8df]", children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between gap-2", children: [
                    /* @__PURE__ */ jsxDEV("strong", { className: "text-[11px]", children: bot.name }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1668,
                      columnNumber: 900
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold", children: state.status }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1668,
                      columnNumber: 951
                    }, this)
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1668,
                    columnNumber: 856
                  }, this),
                  /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-[#73796f] mt-1", children: state.detail }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1668,
                    columnNumber: 1018
                  }, this)
                ] }, bot.id, true, {
                  fileName: "<stdin>",
                  lineNumber: 1668,
                  columnNumber: 774
                }, this);
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1668,
                columnNumber: 541
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1668,
              columnNumber: 44
            }, this) : /* @__PURE__ */ jsxDEV("p", { className: "mt-4 text-xs text-[#73796f]", children: "No workflow has been run for this business yet." }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1668,
              columnNumber: 1109
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1666,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5", children: botDefs.map((b) => {
            const live = currentWorkflowRun?.botTimes[b.id];
            const elapsed = live ? live.elapsedMs + (live.startedAt ? Date.now() - live.startedAt : 0) : 0;
            return /* @__PURE__ */ jsxDEV("div", { className: "p-5 rounded-2xl bg-white border border-[#e8e2d8] shadow-sm flex flex-col justify-between", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3 mb-3", children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "w-9 h-9 rounded-xl bg-[#5b0e14] text-[#f1e194] flex items-center justify-center font-extrabold text-xs shadow-xs", children: b.icon }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1680,
                    columnNumber: 25
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxDEV("h3", { className: "text-xs font-bold text-[#1d211b] truncate", children: b.name }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1684,
                      columnNumber: 27
                    }, this),
                    /* @__PURE__ */ jsxDEV("small", { className: "block text-[10px] text-[#73796f] truncate", children: b.job }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1685,
                      columnNumber: 27
                    }, this)
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1683,
                    columnNumber: 25
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold text-[#527247] bg-[#edf3e9] px-2 py-0.5 rounded-full", children: [
                    "\u25CF ",
                    live?.state || "Idle",
                    live ? ` \xB7 ${Math.floor(elapsed / 6e4)}:${String(Math.floor(elapsed / 1e3) % 60).padStart(2, "0")}` : ""
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1687,
                    columnNumber: 25
                  }, this)
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1679,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#493f38] leading-relaxed mb-4", children: b.desc }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1692,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1678,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "pt-3 border-t border-[#f0ece4] space-y-1.5", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between text-[10px]", children: [
                  /* @__PURE__ */ jsxDEV("span", { className: "text-[#85867c] truncate max-w-[170px]", children: live?.step || "No active workflow task" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1697,
                    columnNumber: 25
                  }, this),
                  /* @__PURE__ */ jsxDEV("strong", { className: "text-[#5b0e14]", children: live ? live.state === "Complete" ? "100%" : live.state === "Working" ? "Working" : live.state : "\u2014" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1698,
                    columnNumber: 25
                  }, this)
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1696,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "w-full h-1.5 rounded-full bg-[#f0ece4] overflow-hidden", children: /* @__PURE__ */ jsxDEV("div", { className: "h-full rounded-full bg-[#5b0e14]", style: { width: `${live ? live.state === "Complete" ? 100 : live.state === "Working" ? 62 : 0 : 0}%` } }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1701,
                  columnNumber: 25
                }, this) }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1700,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1695,
                columnNumber: 21
              }, this)
            ] }, b.id, true, {
              fileName: "<stdin>",
              lineNumber: 1677,
              columnNumber: 19
            }, this);
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1672,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "p-6 rounded-2xl bg-white border border-[#e8e2d8] shadow-sm space-y-4", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxDEV("h3", { className: "text-sm font-bold text-[#1d211b]", children: [
                "Supervised Task Queue (",
                botTasks.length,
                ")"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1712,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => setIsAssignTaskOpen(true),
                  className: "text-xs font-bold text-[#5b0e14] hover:underline",
                  children: "+ Assign New Task"
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 1713,
                  columnNumber: 19
                },
                this
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1711,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: botTasks.map((t) => /* @__PURE__ */ jsxDEV(
              "div",
              {
                className: "p-4 rounded-xl border border-[#ece8df] bg-[#faf8f2] flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 mb-1", children: [
                      /* @__PURE__ */ jsxDEV("strong", { className: "text-xs font-bold text-[#1d211b]", children: t.title }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 1729,
                        columnNumber: 27
                      }, this),
                      /* @__PURE__ */ jsxDEV("span", { className: `px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${t.status === "completed" ? "bg-[#eef4e9] text-[#527247]" : ["preparing", "running"].includes(t.status) ? "bg-[#e8f1f7] text-[#2872a1]" : t.status === "failed" ? "bg-[#fff0df] text-[#a55c2a]" : t.status === "cancelled" ? "bg-[#f0ece4] text-[#73796f]" : "bg-[#f1e194]/50 text-[#5b0e14]"}`, children: [
                        "Backend job \xB7 ",
                        t.status.replace("_", " ")
                      ] }, void 0, true, {
                        fileName: "<stdin>",
                        lineNumber: 1730,
                        columnNumber: 27
                      }, this)
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 1728,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f] leading-relaxed", children: t.instructions }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1732,
                      columnNumber: 25
                    }, this),
                    t.progress > 0 && /* @__PURE__ */ jsxDEV("div", { className: "mt-2 h-1.5 rounded-full bg-[#ece8df] overflow-hidden", children: /* @__PURE__ */ jsxDEV("div", { className: "h-full bg-[#5b0e14] transition-all", style: { width: `${t.progress}%` } }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1733,
                      columnNumber: 114
                    }, this) }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1733,
                      columnNumber: 44
                    }, this),
                    t.result && /* @__PURE__ */ jsxDEV("div", { className: "mt-3 p-3 rounded-lg bg-white border border-[#e8e2d8] text-xs text-[#493f38] whitespace-pre-wrap leading-relaxed", children: [
                      /* @__PURE__ */ jsxDEV("strong", { className: "block text-[10px] uppercase tracking-wider text-[#73796f] mb-1", children: "Bot result \xB7 engineer handoff" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 1734,
                        columnNumber: 167
                      }, this),
                      t.result
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 1734,
                      columnNumber: 38
                    }, this),
                    /* @__PURE__ */ jsxDEV("small", { className: "block text-[10px] text-[#85867c] mt-1", children: [
                      "Owner: ",
                      ownerUsername ? `@${ownerUsername}` : "Project owner",
                      " \xB7 Client: ",
                      businesses.find((business) => business.id === t.businessId)?.name || t.businessId,
                      " \xB7 Assignee: ",
                      botDefs.find((b) => b.id === t.botId)?.name || t.botId,
                      " \xB7 Time: ",
                      Math.floor(((t.elapsedMs || 0) + (t.startedAt ? Date.now() - new Date(t.startedAt).getTime() : 0)) / 6e4),
                      ":",
                      String(Math.floor(((t.elapsedMs || 0) + (t.startedAt ? Date.now() - new Date(t.startedAt).getTime() : 0)) / 1e3) % 60).padStart(2, "0"),
                      " \xB7 Engineer Note:",
                      " ",
                      t.engineerNote,
                      t.modelInfo && (t.modelInfo.provider || t.modelInfo.model) ? ` \xB7 Model: ${[t.modelInfo.provider, t.modelInfo.model].filter(Boolean).join(" / ")}` : ""
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 1735,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1727,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 shrink-0", children: t.status === "queued" ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
                    /* @__PURE__ */ jsxDEV("button", { onClick: () => handleExecuteBotTask(t), className: "px-3 py-1.5 rounded-lg bg-[#e8f1f7] text-[#2872a1] text-xs font-bold hover:bg-[#dcebf4] flex items-center gap-1", children: [
                      /* @__PURE__ */ jsxDEV(RefreshCw, { className: "w-3.5 h-3.5" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 1744,
                        columnNumber: 201
                      }, this),
                      /* @__PURE__ */ jsxDEV("span", { children: "Run bot task" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 1744,
                        columnNumber: 238
                      }, this)
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 1744,
                      columnNumber: 29
                    }, this),
                    /* @__PURE__ */ jsxDEV("button", { onClick: () => handleUpdateTaskStatus(t.id, "cancelled", { activeStep: "Cancelled before execution", engineerNote: "Owner cancelled the queued job before a bot request started." }), className: "px-3 py-1.5 rounded-lg border border-[#ded8cc] bg-white text-xs font-semibold text-[#73796f]", children: "Cancel" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1745,
                      columnNumber: 29
                    }, this)
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1743,
                    columnNumber: 27
                  }, this) : ["preparing", "running"].includes(t.status) ? /* @__PURE__ */ jsxDEV("span", { className: "px-3 py-1.5 rounded-lg bg-[#e8f1f7] text-[#2872a1] text-xs font-bold", children: [
                    "Backend job ",
                    t.status,
                    "\u2026"
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1748,
                    columnNumber: 27
                  }, this) : t.status === "failed" ? /* @__PURE__ */ jsxDEV("button", { onClick: () => handleExecuteBotTask(t), className: "px-3 py-1.5 rounded-lg border border-[#ded8cc] bg-white text-xs font-semibold text-[#493f38]", children: "Run again" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1750,
                    columnNumber: 27
                  }, this) : ["completed", "partially_completed"].includes(t.status) && t.reviewStatus !== "approved" ? /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxDEV("button", { onClick: () => handleExecuteBotTask(t), className: "px-3 py-1.5 rounded-lg border border-[#ded8cc] bg-white text-xs font-semibold text-[#493f38]", children: "Run again" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1752,
                      columnNumber: 68
                    }, this),
                    /* @__PURE__ */ jsxDEV("button", { onClick: () => handleUpdateTaskStatus(t.id, "completed", { reviewStatus: "approved", engineerNote: "Owner approved the backend job result." }), className: "px-3 py-1.5 rounded-lg bg-[#527247] text-white text-xs font-bold hover:bg-[#435e3a]", children: t.status === "partially_completed" ? "Accept partial" : "Approve result" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1752,
                      columnNumber: 239
                    }, this)
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1752,
                    columnNumber: 27
                  }, this) : /* @__PURE__ */ jsxDEV("button", { onClick: () => handleUpdateTaskStatus(t.id, "queued", { result: "", reviewStatus: "pending", engineerNote: "Reopened by owner for another bot pass." }), className: "px-3 py-1.5 rounded-lg border border-[#ded8cc] bg-white text-xs font-medium text-[#493f38] hover:bg-[#f4efe4]", children: "Reopen" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1754,
                    columnNumber: 27
                  }, this) }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1741,
                    columnNumber: 23
                  }, this)
                ]
              },
              t.id,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 1723,
                columnNumber: 21
              },
              this
            )) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1721,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1710,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1648,
          columnNumber: 13
        }, this),
        currentView === "chat" && /* @__PURE__ */ jsxDEV("div", { className: "space-y-4 max-w-4xl mx-auto", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between pb-2 border-b border-[#e8e2d8]", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("h1", { className: "text-2xl font-extrabold text-[#1d211b]", children: "Team Chat" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1769,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f]", children: [
                "Speak directly with any bot. Replies include current public niche references for ",
                currentBiz.name,
                " when search results are available."
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1770,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1768,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f]", children: "Chat with:" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1776,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV(
                "select",
                {
                  value: chatBot,
                  onChange: (e) => setChatBot(e.target.value),
                  className: "px-3 py-1.5 text-xs rounded-xl border border-[#ded8cc] bg-white font-semibold text-[#1d211b]",
                  children: botDefs.map((b) => /* @__PURE__ */ jsxDEV("option", { value: b.id, children: b.name }, b.id, false, {
                    fileName: "<stdin>",
                    lineNumber: 1783,
                    columnNumber: 23
                  }, this))
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 1777,
                  columnNumber: 19
                },
                this
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1775,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1767,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "h-[520px] rounded-2xl border border-[#e8e2d8] bg-white p-5 overflow-y-auto space-y-3.5 shadow-sm", children: [
            chatMessages.length === 0 && /* @__PURE__ */ jsxDEV("div", { className: "text-center py-20 text-[#85867c]", children: [
              /* @__PURE__ */ jsxDEV(Bot, { className: "w-10 h-10 mx-auto text-[#ded8cc] mb-2" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1795,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("strong", { className: "block text-sm font-bold text-[#1d211b]", children: [
                "Ask ",
                botDefs.find((b) => b.id === chatBot)?.name
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1796,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-xs mt-1", children: "Ask about photo adjustments, brand angles, platform rules, or campaign concepts." }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1797,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1794,
              columnNumber: 19
            }, this),
            chatMessages.map((msg, i) => {
              const isUser = msg.role === "user";
              return /* @__PURE__ */ jsxDEV(
                "div",
                {
                  className: `flex flex-col ${isUser ? "items-end" : "items-start"} max-w-2xl ${isUser ? "ml-auto" : "mr-auto"}`,
                  children: [
                    /* @__PURE__ */ jsxDEV("small", { className: "text-[10px] font-bold text-[#85867c] mb-1", children: isUser ? "You (Owner)" : botDefs.find((b) => b.id === msg.botId)?.name || "Bot" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1812,
                      columnNumber: 23
                    }, this),
                    /* @__PURE__ */ jsxDEV(
                      "div",
                      {
                        className: `p-3.5 rounded-2xl text-xs leading-relaxed ${isUser ? "bg-[#5b0e14] text-[#fff8ed] rounded-tr-xs" : "bg-[#faf8f2] border border-[#ece8df] text-[#1d211b] rounded-tl-xs"}`,
                        children: msg.content
                      },
                      void 0,
                      false,
                      {
                        fileName: "<stdin>",
                        lineNumber: 1815,
                        columnNumber: 23
                      },
                      this
                    ),
                    !isUser && !!msg.references?.length && /* @__PURE__ */ jsxDEV("div", { className: "mt-2 max-w-2xl space-y-1", children: msg.references.slice(0, 4).map((source, sourceIndex) => /* @__PURE__ */ jsxDEV("a", { href: source.url, target: "_blank", rel: "noreferrer", className: "flex items-center gap-1 text-[10px] text-[#2872a1] hover:underline", children: [
                      /* @__PURE__ */ jsxDEV(ExternalLink, { className: "w-3 h-3" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 1824,
                        columnNumber: 345
                      }, this),
                      /* @__PURE__ */ jsxDEV("span", { className: "truncate", children: [
                        source.platform || "Public source",
                        " \xB7 ",
                        source.title
                      ] }, void 0, true, {
                        fileName: "<stdin>",
                        lineNumber: 1824,
                        columnNumber: 380
                      }, this)
                    ] }, `${source.url}-${sourceIndex}`, true, {
                      fileName: "<stdin>",
                      lineNumber: 1824,
                      columnNumber: 175
                    }, this)) }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1824,
                      columnNumber: 63
                    }, this)
                  ]
                },
                i,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 1806,
                  columnNumber: 21
                },
                this
              );
            }),
            isChatSending && /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 text-xs text-[#85867c] italic", children: [
              /* @__PURE__ */ jsxDEV(RefreshCw, { className: "w-3.5 h-3.5 animate-spin text-[#5b0e14]" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1831,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("span", { children: "Bot team reviewing context..." }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1832,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1830,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1792,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("form", { onSubmit: handleSendChat, className: "flex gap-2", children: [
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "text",
                value: chatInput,
                onChange: (e) => setChatInput(e.target.value),
                placeholder: `Message ${botDefs.find((b) => b.id === chatBot)?.name}...`,
                className: "flex-1 px-4 py-3 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 1839,
                columnNumber: 17
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "submit",
                disabled: isChatSending || !chatInput.trim(),
                className: "px-5 py-3 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] transition-colors flex items-center gap-1.5 disabled:opacity-50",
                children: [
                  /* @__PURE__ */ jsxDEV(Send, { className: "w-4 h-4" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1851,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { children: "Send" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1852,
                    columnNumber: 19
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 1846,
                columnNumber: 17
              },
              this
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1838,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1766,
          columnNumber: 13
        }, this),
        currentView === "learning" && /* @__PURE__ */ jsxDEV("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "pb-2 border-b border-[#e8e2d8]", children: [
            /* @__PURE__ */ jsxDEV("h1", { className: "text-2xl font-extrabold text-[#1d211b]", children: "Review & Bot Learning" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1862,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f]", children: "Approving artwork or copy stores real preferences and training guidance for your bot team." }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1863,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1861,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "p-5 rounded-2xl bg-white border border-[#e8e2d8] shadow-sm space-y-3", children: [
              /* @__PURE__ */ jsxDEV("h3", { className: "text-sm font-bold text-[#1d211b]", children: [
                "Images Awaiting Sign-off (",
                businessPosts.filter((p) => !p.imageApproved).length,
                ")"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1871,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: [
                businessPosts.filter((p) => !p.imageApproved).map((post) => /* @__PURE__ */ jsxDEV(
                  "div",
                  {
                    className: "flex items-center gap-3 p-3 rounded-xl border border-[#ece8df] bg-[#faf8f2]",
                    children: [
                      post.imageUrl ? /* @__PURE__ */ jsxDEV("img", { src: post.imageUrl, alt: post.title, referrerPolicy: "no-referrer", className: "w-14 h-14 rounded-lg object-cover" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 1883,
                        columnNumber: 44
                      }, this) : /* @__PURE__ */ jsxDEV("div", { className: "w-14 h-14 rounded-lg bg-[#5b0e14] text-[8px] text-white flex items-center justify-center text-center", children: "Photo needed" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 1883,
                        columnNumber: 166
                      }, this),
                      /* @__PURE__ */ jsxDEV("div", { className: "flex-1 min-w-0", children: [
                        /* @__PURE__ */ jsxDEV("strong", { className: "block text-xs font-bold text-[#1d211b] truncate", children: post.title }, void 0, false, {
                          fileName: "<stdin>",
                          lineNumber: 1885,
                          columnNumber: 29
                        }, this),
                        /* @__PURE__ */ jsxDEV("small", { className: "block text-[10px] text-[#73796f] truncate", children: [
                          post.platform,
                          " \xB7 ",
                          currentBiz.name
                        ] }, void 0, true, {
                          fileName: "<stdin>",
                          lineNumber: 1886,
                          columnNumber: 29
                        }, this)
                      ] }, void 0, true, {
                        fileName: "<stdin>",
                        lineNumber: 1884,
                        columnNumber: 27
                      }, this),
                      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1.5", children: [
                        /* @__PURE__ */ jsxDEV(
                          "button",
                          {
                            onClick: () => setAdjustingPost(post),
                            className: "px-2.5 py-1.5 rounded-lg bg-[#f1e194] text-[#5b0e14] text-xs font-bold hover:bg-[#fff2ab]",
                            children: "Edit Photo"
                          },
                          void 0,
                          false,
                          {
                            fileName: "<stdin>",
                            lineNumber: 1889,
                            columnNumber: 29
                          },
                          this
                        ),
                        /* @__PURE__ */ jsxDEV(
                          "button",
                          {
                            onClick: () => {
                              handleUpdatePost({ ...post, imageApproved: true });
                              showToast("Image approved! Bot memory updated.");
                            },
                            className: "px-2.5 py-1.5 rounded-lg bg-[#5b0e14] text-white text-xs font-bold hover:bg-[#74131c]",
                            children: "Approve"
                          },
                          void 0,
                          false,
                          {
                            fileName: "<stdin>",
                            lineNumber: 1895,
                            columnNumber: 29
                          },
                          this
                        )
                      ] }, void 0, true, {
                        fileName: "<stdin>",
                        lineNumber: 1888,
                        columnNumber: 27
                      }, this)
                    ]
                  },
                  post.id,
                  true,
                  {
                    fileName: "<stdin>",
                    lineNumber: 1879,
                    columnNumber: 25
                  },
                  this
                )),
                businessPosts.filter((p) => !p.imageApproved).length === 0 && /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#85867c] py-6 text-center", children: [
                  "All images for ",
                  currentBiz.name,
                  " are approved!"
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1909,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1875,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1870,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "p-5 rounded-2xl bg-white border border-[#e8e2d8] shadow-sm space-y-3", children: [
              /* @__PURE__ */ jsxDEV("h3", { className: "text-sm font-bold text-[#1d211b]", children: "Bot Guidance & Approval Memory" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1916,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "space-y-2.5", children: learning.slice(0, 6).map((item, idx) => /* @__PURE__ */ jsxDEV("div", { className: "p-3 rounded-xl border border-[#ece8df] bg-[#faf8f2] text-xs text-[#493f38]", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between text-[10px] font-bold text-[#5b0e14] mb-1", children: [
                  /* @__PURE__ */ jsxDEV("span", { children: botDefs.find((b) => b.id === item.bot_id)?.name || item.bot_id }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1921,
                    columnNumber: 27
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "text-[#85867c]", children: item.source || "approval" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1922,
                    columnNumber: 27
                  }, this)
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 1920,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "leading-relaxed", children: item.note }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1924,
                  columnNumber: 25
                }, this)
              ] }, idx, true, {
                fileName: "<stdin>",
                lineNumber: 1919,
                columnNumber: 23
              }, this)) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1917,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1915,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1868,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1860,
          columnNumber: 13
        }, this),
        currentView === "settings" && /* @__PURE__ */ jsxDEV("div", { className: "space-y-6 max-w-4xl", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "pb-2 border-b border-[#e8e2d8]", children: [
            /* @__PURE__ */ jsxDEV("h1", { className: "text-2xl font-extrabold text-[#1d211b]", children: "Settings & Workspace" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1937,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f]", children: "Global rules, photo licensing origins, and API integrations." }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1938,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1936,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "p-6 rounded-2xl bg-white border border-[#e8e2d8] shadow-sm space-y-4", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between py-2 border-b border-[#f0ece4] text-xs", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-[#1d211b]", children: "Workspace Owner" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1943,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-[#73796f]", children: "Dan B Clarks (Owner account)" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1944,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1942,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between py-2 border-b border-[#f0ece4] text-xs", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-[#1d211b]", children: "Active Subaccounts" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1947,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-[#73796f]", children: [
                businesses.length,
                " Managed Subaccounts"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1948,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1946,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between py-2 border-b border-[#f0ece4] text-xs", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-[#1d211b]", children: "Commercial Photo Sources" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1951,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-[#73796f]", children: "Wikimedia Commons, Openverse, Curated Unsplash" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1952,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1950,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between py-2 border-b border-[#f0ece4] text-xs", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-[#1d211b]", children: "Visual Editor Model" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1955,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-[#73796f]", children: "Gemini 3.8 Flash (Interactive Agent)" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1956,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1954,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between py-2 text-xs", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-[#1d211b]", children: "Canvas Compositor" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1959,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-[#527247] font-semibold", children: "CORS-Safe Proxy Enabled (Instant Download)" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1960,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1958,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1941,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1935,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 914,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 911,
      columnNumber: 7
    }, this),
    adjustingPost && /* @__PURE__ */ jsxDEV(
      PhotoAdjusterModal,
      {
        post: adjustingPost,
        biz: currentBiz,
        onClose: () => setAdjustingPost(null),
        onUpdatePost: handleUpdatePost,
        onOpenCatalogSearch: (p) => {
          setAdjustingPost(null);
          setCatalogSearchPost(p);
        },
        onRegeneratePhoto: async (p) => {
          const classification = classifyEgyptianNiche({ query: p.contentFormat || p.title, business: currentBiz });
          const response = await fetch("/api/crm/generate-photo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId: currentBiz.id, brief: p.title, aspectRatio: p.adjustments?.aspectRatio || "1:1", classification })
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok || !data.url) throw new Error(data.error || "A fresh image was not available.");
          const updated = { ...p, imageUrl: data.url, imageSource: data.source, imageApproved: false, imageError: false, imageStatus: "Fresh niche-matched photo generated" };
          handleUpdatePost(updated);
          setAdjustingPost(updated);
          showToast("Fresh image generated & applied!");
        },
        showToast
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 1970,
        columnNumber: 9
      },
      this
    ),
    reviewingPost && /* @__PURE__ */ jsxDEV(
      PostReviewModal,
      {
        post: reviewingPost,
        biz: currentBiz,
        onClose: () => setReviewingPost(null),
        onUpdatePost: handleUpdatePost,
        onOpenAdjuster: (p) => {
          setReviewingPost(null);
          setAdjustingPost(p);
        },
        onOpenCatalogSearch: (p) => {
          setReviewingPost(null);
          setCatalogSearchPost(p);
        },
        showToast
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 1997,
        columnNumber: 9
      },
      this
    ),
    catalogSearchPost && /* @__PURE__ */ jsxDEV(
      CatalogSearchModal,
      {
        targetPost: catalogSearchPost,
        biz: currentBiz,
        onClose: () => setCatalogSearchPost(null),
        onSelectPhoto: (photo) => {
          const updated = {
            ...catalogSearchPost,
            imageUrl: photo.url,
            imageSource: photo,
            imageApproved: true
          };
          handleUpdatePost(updated);
          showToast("Catalog photo attached to draft!");
        },
        showToast
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 2015,
        columnNumber: 9
      },
      this
    ),
    isAddBizOpen && /* @__PURE__ */ jsxDEV(
      AddBusinessModal,
      {
        initialBusiness: editingBusiness || void 0,
        onClose: () => {
          setIsAddBizOpen(false);
          setEditingBusiness(null);
        },
        onAddBusiness: handleAddBusiness,
        showToast
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 2034,
        columnNumber: 9
      },
      this
    ),
    isAssignTaskOpen && /* @__PURE__ */ jsxDEV(
      AssignTaskModal,
      {
        businesses,
        currentBizId: currentBiz.id,
        bots: botDefs,
        onClose: () => setIsAssignTaskOpen(false),
        onAssignTask: handleAssignTask,
        showToast
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 2043,
        columnNumber: 9
      },
      this
    )
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 889,
    columnNumber: 5
  }, this);
}
export {
  App as default
};
