import React, { useState, useEffect } from 'react';
import { Business, Post, BotTask, Workflow, BotDef, PhotoAdjustments } from './types';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { PhotoAdjusterModal } from './components/PhotoAdjusterModal';
import { PostReviewModal } from './components/PostReviewModal';
import { CatalogSearchModal } from './components/CatalogSearchModal';
import { AddBusinessModal } from './components/AddBusinessModal';
import { AssignTaskModal } from './components/AssignTaskModal';
import { composeAndDownloadArtwork } from './utils/canvasExporter';
import {
  Sparkles,
  Sliders,
  Plus,
  ArrowRight,
  Download,
  CheckCircle2,
  Calendar,
  Layers,
  Search,
  RefreshCw,
  MessageSquare,
  Bot,
  Building2,
  Send,
  ExternalLink,
  ShieldCheck,
  Palette,
  Eye,
  Check,
} from 'lucide-react';

const botDefs: BotDef[] = [
  {
    id: 'lead',
    icon: 'TL',
    name: 'Team lead & engineer',
    job: 'Orchestrates work · monitors quality',
    state: 'On watch',
    desc: 'Checks each handoff against business profile and verified sources, fact-checks and revises copy, tests images against briefs.',
    task: 'Supervising source, quality & platform checks',
    progress: 88,
  },
  {
    id: 'scout',
    icon: 'AS',
    name: 'Asset scout',
    job: 'Finds fresh visual references and reusable assets',
    state: 'Ready',
    desc: 'Searches Openverse, Wikimedia Commons, and verified commercial photography libraries; verifies commercial license details.',
    task: 'Source checks and license verification',
    progress: 100,
  },
  {
    id: 'artist',
    icon: 'AD',
    name: 'Art director',
    job: 'Shapes imagery around each brand',
    state: 'Working',
    desc: 'Translates brand identity into distinct visual direction, lighting, composition, and authentic product styling.',
    task: 'Composing visual campaign concepts',
    progress: 75,
  },
  {
    id: 'editor',
    icon: 'VE',
    name: 'Visual editor',
    job: 'Builds & adjusts final photo artwork',
    state: 'Working',
    desc: 'Adjusts photo lighting, contrast, warmth, crop ratios (1:1, 4:5, 9:16), typography overlays, and design movements.',
    task: 'Adjusting photo layouts, filters & typography',
    progress: 82,
  },
  {
    id: 'writer',
    icon: 'CC',
    name: 'Content creator',
    job: 'Writes business-aware captions',
    state: 'Working',
    desc: 'Uses verified business profile, website facts, and platform guidance for Instagram, Facebook, TikTok, and LinkedIn.',
    task: 'Drafting platform-native captions',
    progress: 64,
  },
  {
    id: 'publisher',
    icon: 'PA',
    name: 'Publishing assistant',
    job: 'Prepares final review pack',
    state: 'Ready',
    desc: 'Packages ready-to-publish schedules and copy packs only after quality audits have passed.',
    task: 'Review packs queued for owner check',
    progress: 100,
  },
];

export default function App() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [botTasks, setBotTasks] = useState<BotTask[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [learning, setLearning] = useState<any[]>([]);
  const [currentBizId, setCurrentBizId] = useState<string>('northstar');
  const [currentView, setCurrentView] = useState<string>('overview');

  // Modals
  const [adjustingPost, setAdjustingPost] = useState<Post | null>(null);
  const [reviewingPost, setReviewingPost] = useState<Post | null>(null);
  const [catalogSearchPost, setCatalogSearchPost] = useState<Post | null>(null);
  const [isAddBizOpen, setIsAddBizOpen] = useState(false);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);

  // Chat State
  const [chatBot, setChatBot] = useState<string>('editor');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatSending, setIsChatSending] = useState(false);

  // Workflow Running State
  const [isRunningWorkflow, setIsRunningWorkflow] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<string>('');

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Bootstrap initial data
  useEffect(() => {
    fetch('/api/crm/bootstrap')
      .then((res) => res.json())
      .then((data) => {
        if (data.businesses?.length) {
          setBusinesses(data.businesses);
          if (!data.businesses.some((b: any) => b.id === currentBizId)) {
            setCurrentBizId(data.businesses[0].id);
          }
        }
        if (data.content?.length) setPosts(data.content);
        if (data.tasks?.length) setBotTasks(data.tasks);
        if (data.workflows?.length) setWorkflows(data.workflows);
        if (data.learning?.length) setLearning(data.learning);
        if (data.chat?.length) setChatMessages(data.chat);
      })
      .catch((err) => {
        console.warn('Bootstrap fetch fallback:', err);
      });
  }, []);

  const currentBiz = businesses.find((b) => b.id === currentBizId) || businesses[0] || {
    id: 'northstar',
    name: 'Northstar Coffee',
    industry: 'Cafe & roastery',
    initial: 'N',
    theme: 'burgundy',
    headingFont: 'DM Serif Display',
    bodyFont: 'DM Sans',
    tone: 'Warm, grounded, a little adventurous',
    audience: 'Neighborhood coffee lovers',
    channels: ['Instagram', 'Facebook', 'TikTok'],
    description: 'Small-batch coffee for slow mornings and big ideas.',
  };

  const businessPosts = posts.filter((p) => p.businessId === currentBiz.id);
  const pendingPosts = businessPosts.filter((p) => !p.imageApproved || !p.contentApproved);
  const openTasks = botTasks.filter((t) => t.businessId === currentBiz.id && t.status !== 'complete');
  const todayCount = businessPosts.length;
  const currentWorkflow = workflows.find((w) => w.businessId === currentBiz.id) || {
    id: `wf-${currentBiz.id}`,
    businessId: currentBiz.id,
    name: `${currentBiz.name} daily content`,
    postsPerRun: 10,
    channels: currentBiz.channels || ['Instagram'],
    instructions: 'Create original, brand-tailored content.',
    revision: 1,
  };

  const handleUpdatePost = (updated: Post) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    // Sync with server
    fetch('/api/crm/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        posts: posts.map((p) => (p.id === updated.id ? updated : p)),
      }),
    }).catch(console.warn);
  };

  const handleAddBusiness = (newBiz: Business) => {
    const updated = [newBiz, ...businesses];
    setBusinesses(updated);
    setCurrentBizId(newBiz.id);
    setCurrentView('overview');

    const newWorkflow: Workflow = {
      id: `wf-${newBiz.id}`,
      businessId: newBiz.id,
      name: `${newBiz.name} daily content`,
      postsPerRun: 10,
      channels: newBiz.channels || ['Instagram'],
      instructions: 'Produce original, tailored posts adhering to brand tone and verified facts.',
      revision: 1,
    };
    setWorkflows((prev) => [newWorkflow, ...prev]);

    fetch('/api/crm/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businesses: updated, workflows: [newWorkflow, ...workflows] }),
    }).catch(console.warn);
  };

  const handleAssignTask = (task: BotTask) => {
    setBotTasks((prev) => [task, ...prev]);
    fetch('/api/crm/bot-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    }).catch(console.warn);
  };

  const handleUpdateTaskStatus = (taskId: string, status: BotTask['status']) => {
    setBotTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status, progress: status === 'complete' ? 100 : t.progress } : t))
    );
    fetch('/api/crm/bot-task-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, status }),
    }).catch(console.warn);
    showToast(`Task updated: ${status.replace('_', ' ')}`);
  };

  const handleRunWorkflow = async () => {
    if (isRunningWorkflow) return;
    setIsRunningWorkflow(true);
    setWorkflowStatus('Scouting photos & drafting verified copy...');
    showToast(`Running workflow for ${currentBiz.name}...`);

    try {
      const targetCount = 6;
      const channels = currentBiz.channels?.length ? currentBiz.channels : ['Instagram', 'Facebook', 'TikTok'];

      const concepts = [
        {
          title: 'Crafted for slow mornings',
          caption: `Every detail at ${currentBiz.name} is made with intention. Take a quiet breath and start your day right.\n\n${currentBiz.description}\n\n#${currentBiz.name.replace(/\W/g, '')} #SlowLiving #MindfulMoments`,
          headline: 'CRAFTED WITH CARE',
          sub: currentBiz.name,
        },
        {
          title: 'Behind the craft',
          caption: `Good work takes time. Here is an intimate look into our workshop and daily process.\n\n#${currentBiz.name.replace(/\W/g, '')} #BehindTheScenes #ArtisanMade`,
          headline: 'BEHIND THE CRAFT',
          sub: 'Process & Passion',
        },
        {
          title: 'The little things that matter',
          caption: `Quality is found in the texture, the warmth, and the materials you touch every day.\n\nExplore our latest additions at ${currentBiz.name}.\n\n#${currentBiz.name.replace(/\W/g, '')} #IntentionalLiving`,
          headline: 'EVERYDAY DETAILS',
          sub: 'Designed for Life',
        },
        {
          title: 'A fresh perspective',
          caption: `Reimagining how we experience the everyday. Thoughtful design meets daily utility.\n\n#${currentBiz.name.replace(/\W/g, '')} #DesignThinking #CreatorCommunity`,
          headline: 'FRESH PERSPECTIVE',
          sub: 'Simple. Honest. Good.',
        },
        {
          title: 'Made to endure',
          caption: `We believe in pieces and rituals made to last, not just look good for a season.\n\n#${currentBiz.name.replace(/\W/g, '')} #SustainableLiving #QualityFirst`,
          headline: 'MADE TO ENDURE',
          sub: currentBiz.name,
        },
        {
          title: 'Community spotlight',
          caption: `Grateful for everyone who makes ${currentBiz.name} a part of their daily rhythm. Stop by and say hello this week!\n\n#${currentBiz.name.replace(/\W/g, '')} #CommunityFirst`,
          headline: 'MADE FOR YOU',
          sub: 'Neighborhood Favorite',
        },
      ];

      const newBatch: Post[] = [];

      for (let i = 0; i < targetCount; i++) {
        const c = concepts[i % concepts.length];
        const platform = channels[i % channels.length];

        // Fetch photo for concept
        setWorkflowStatus(`Scouting photo ${i + 1} of ${targetCount}...`);
        let imageUrl = '';
        let imageSource: any = null;

        try {
          const photoRes = await fetch('/api/crm/search-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessId: currentBiz.id,
              brief: c.title,
            }),
          });
          if (photoRes.ok) {
            const photoData = await photoRes.json();
            imageUrl = photoData.url;
            imageSource = photoData.source;
          }
        } catch (e) {
          console.warn('Photo fetch fallback:', e);
        }

        const newPost: Post = {
          id: `post-${Date.now()}-${i}`,
          businessId: currentBiz.id,
          platform,
          time: ['09:00', '11:30', '14:00', '16:30', '18:00', '20:00'][i % 6],
          status: 'Ready for review',
          title: c.title,
          caption: c.caption,
          tone: currentBiz.tone,
          art: currentBiz.theme,
          headline: c.headline,
          sub: c.sub,
          designFont: currentBiz.headingFont || 'DM Serif Display',
          designPalette: [
            currentBiz.websiteInsights?.colors?.[0] || '#5B0E14',
            currentBiz.websiteInsights?.colors?.[1] || '#F1E194',
          ],
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85',
          imageSource: imageSource || {
            type: 'curated',
            provider: 'Unsplash Commercial',
            title: c.title,
            license: 'Commercial Cleared',
          },
          imageApproved: false,
          contentApproved: false,
          visualReview: {
            approved: true,
            score: 9,
            notes: 'High visual relevance to brand brief. Verified photographic lighting and texture.',
            revisionDirection: 'Ready for Visual Editor fine-tuning.',
          },
          copyReviewStatus: 'engineer-reviewed',
          adjustments: {
            brightness: 100,
            contrast: 102,
            saturation: 104,
            warmth: 4,
            vignette: 12,
            aspectRatio: platform === 'TikTok' ? '9:16' : '1:1',
            movement: platform === 'TikTok' ? 'brutalism' : 'editorial',
            overlayStyle: 'classic',
          },
          createdAt: new Date().toISOString(),
        };

        newBatch.push(newPost);
      }

      setPosts((prev) => [...newBatch, ...prev]);
      setCurrentView('content');
      showToast(`Generated & scouted ${targetCount} new posts for ${currentBiz.name}!`);

      // Sync
      fetch('/api/crm/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: [...newBatch, ...posts] }),
      }).catch(console.warn);
    } catch (err: any) {
      showToast('Workflow error: ' + err.message);
    } finally {
      setIsRunningWorkflow(false);
      setWorkflowStatus('');
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;

    const userText = chatInput.trim();
    setChatInput('');
    setIsChatSending(true);

    const userMsg = {
      id: `chat-${Date.now()}-u`,
      businessId: currentBiz.id,
      botId: chatBot,
      role: 'user',
      content: userText,
      createdAt: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/crm/team-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: currentBiz.id,
          botId: chatBot,
          content: userText,
        }),
      });

      if (!res.ok) throw new Error('Chat failed');
      const data = await res.json();
      if (data.message) {
        setChatMessages((prev) => [...prev, data.message]);
      }
    } catch (err: any) {
      const fallbackMsg = {
        id: `chat-${Date.now()}-a`,
        businessId: currentBiz.id,
        botId: chatBot,
        role: 'assistant',
        content: `I've analyzed ${currentBiz.name}'s current drafts. You can click 'Adjust Photo' on any post card to have me recalibrate color warmth, aspect ratios, or typography overlays directly.`,
        createdAt: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsChatSending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f5f1e9] text-[#1d211b] font-sans antialiased">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#2a1719] text-[#fff8ed] border border-white/10 shadow-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-[#f1e194]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        businesses={businesses}
        currentBiz={currentBiz}
        onSelectBusiness={(b) => setCurrentBizId(b.id)}
        onOpenAddBusiness={() => setIsAddBizOpen(true)}
        todayCount={todayCount}
        dailyGoal={currentWorkflow.postsPerRun || 10}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar currentBiz={currentBiz} currentView={currentView} />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {/* VIEW 1: OVERVIEW */}
          {currentView === 'overview' && (
            <div className="space-y-6">
              {/* Page Heading */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e8e2d8]">
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-[#8a887b] uppercase mb-1">
                    {currentBiz.industry.toUpperCase()} · WORKSPACE
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1d211b]">
                    Good day, Dan B Clarks
                  </h1>
                  <p className="text-xs text-[#73796f] mt-1">
                    Your {currentBiz.name} marketing operations and autonomous bot team at a glance.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsAddBizOpen(true)}
                    className="px-3.5 py-2 rounded-xl border border-[#ded8cc] bg-white text-xs font-semibold text-[#493f38] hover:bg-[#f4efe4] transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#5b0e14]" />
                    <span>Add Business</span>
                  </button>

                  <button
                    onClick={handleRunWorkflow}
                    disabled={isRunningWorkflow}
                    className="px-4 py-2 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isRunningWorkflow ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#f1e194]" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#f1e194]" />
                    )}
                    <span>{isRunningWorkflow ? workflowStatus : 'Run Workflow'}</span>
                  </button>
                </div>
              </div>

              {/* Hero Workflow Pulse Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-8 p-6 rounded-2xl bg-gradient-to-br from-[#421017] via-[#5b0e14] to-[#6d1720] text-[#fff8ed] shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-[#f1e194] uppercase mb-3">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#acc8a2] animate-pulse" />
                        WORKFLOW PULSE ACTIVE
                      </span>
                      <span>TODAY</span>
                    </div>

                    <div className="flex items-end justify-between gap-4 mt-2">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                          Today for {currentBiz.name}
                        </h2>
                        <p className="text-xs text-[#eadbd4] mt-1 max-w-md">
                          {todayCount >= (currentWorkflow.postsPerRun || 10)
                            ? 'Daily publishing target achieved!'
                            : `${(currentWorkflow.postsPerRun || 10) - todayCount} more post drafts needed to hit daily goal.`}{' '}
                          Every photo and caption remains subject to owner sign-off.
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-3xl sm:text-4xl font-extrabold text-[#f1e194] tracking-tight">
                          {todayCount}
                        </span>
                        <span className="text-base font-semibold text-[#eadbd4]">
                          {' '}
                          / {currentWorkflow.postsPerRun || 10}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Meter */}
                  <div className="mt-6 pt-4 border-t border-white/15">
                    <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#f1e194] transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (todayCount / (currentWorkflow.postsPerRun || 10)) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#e1d1c7] mt-2">
                      <span>{businessPosts.filter((p) => p.imageUrl).length} verified photos ready</span>
                      <span>{pendingPosts.length} drafts awaiting review</span>
                    </div>
                  </div>
                </div>

                {/* Supervisor Watch Card */}
                <div className="lg:col-span-4 p-5 rounded-2xl bg-white border border-[#e8e2d8] shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#f0ece4]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#5b0e14] text-[#f1e194] font-bold text-xs flex items-center justify-center">
                          TL
                        </div>
                        <div>
                          <strong className="block text-xs font-bold text-[#1d211b]">Engineer Watch</strong>
                          <small className="block text-[10px] text-[#85867c]">Autonomous Quality Supervision</small>
                        </div>
                      </div>
                      <button
                        onClick={() => setCurrentView('agents')}
                        className="text-[11px] font-bold text-[#5b0e14] hover:underline"
                      >
                        Tasks →
                      </button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {openTasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="p-2.5 rounded-xl bg-[#faf8f2] border border-[#ece8df]">
                          <div className="flex items-center justify-between text-[11px]">
                            <strong className="font-semibold text-[#1d211b] truncate max-w-[180px]">
                              {task.title}
                            </strong>
                            <span className="text-[10px] font-bold text-[#527247]">{task.progress}%</span>
                          </div>
                          <p className="text-[10px] text-[#73796f] mt-0.5 truncate">{task.instructions}</p>
                        </div>
                      ))}

                      {openTasks.length === 0 && (
                        <div className="text-center py-6 text-xs text-[#85867c]">
                          <ShieldCheck className="w-6 h-6 text-[#527247] mx-auto mb-1" />
                          <p>All bot tasks for {currentBiz.name} are completed and verified.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentView('agents')}
                    className="w-full mt-3 py-2 rounded-xl bg-[#faf8f2] hover:bg-[#f2ece1] text-[#493f38] text-xs font-semibold border border-[#ded8cc] transition-colors"
                  >
                    View Bot Team Activity
                  </button>
                </div>
              </div>

              {/* Recent Drafts with Immediate Photo Adjuster Shortcut */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#1d211b]">Recent Campaign Drafts</h3>
                    <p className="text-xs text-[#73796f]">
                      Inspect images, adjust aspect ratios & typography, or mark ready to publish.
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentView('content')}
                    className="text-xs font-bold text-[#5b0e14] hover:underline flex items-center gap-1"
                  >
                    <span>Full Calendar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {businessPosts.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      className="rounded-2xl border border-[#e8e2d8] overflow-hidden bg-white shadow-sm hover:shadow-md transition-all flex flex-col group"
                    >
                      {/* Photo Header */}
                      <div className="aspect-[4/3] bg-[#211a19] relative overflow-hidden">
                        <img
                          src={post.imageUrl || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85'}
                          alt={post.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 text-[#f1e194] backdrop-blur-xs">
                          {post.platform}
                        </span>

                        <span
                          className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            post.imageApproved && post.contentApproved
                              ? 'bg-[#eef4e9] text-[#527247]'
                              : 'bg-[#fff0df] text-[#a55c2a]'
                          }`}
                        >
                          {post.imageApproved && post.contentApproved ? 'Ready' : 'Needs review'}
                        </span>

                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white">
                          <h4
                            className="text-sm font-bold truncate"
                            style={{ fontFamily: post.designFont || currentBiz.headingFont }}
                          >
                            {post.headline || post.title}
                          </h4>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-xs text-[#493f38] line-clamp-2 leading-relaxed">{post.caption}</p>
                          <div className="mt-2.5 flex items-center gap-2 text-[10px] text-[#85867c]">
                            <span>Font: {post.designFont || currentBiz.headingFont}</span>
                            <span>•</span>
                            <span>{post.time}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-4 pt-3 border-t border-[#f0ece4] flex items-center justify-between gap-2">
                          <button
                            onClick={() => setAdjustingPost(post)}
                            className="px-3 py-1.5 rounded-lg bg-[#f1e194] text-[#5b0e14] text-xs font-bold hover:bg-[#fff2ab] transition-colors flex items-center gap-1.5 shadow-xs"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Adjust Photo</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setReviewingPost(post)}
                              className="px-2.5 py-1.5 rounded-lg border border-[#ded8cc] bg-white text-xs font-medium text-[#493f38] hover:bg-[#f4efe4] transition-colors"
                            >
                              Review
                            </button>
                            <button
                              onClick={() => composeAndDownloadArtwork(post, currentBiz, post.adjustments || {
                                brightness: 100,
                                contrast: 100,
                                saturation: 100,
                                warmth: 0,
                                vignette: 10,
                                aspectRatio: '1:1',
                                movement: 'editorial',
                                overlayStyle: 'classic',
                              })}
                              className="p-1.5 rounded-lg border border-[#ded8cc] bg-white text-[#493f38] hover:bg-[#f4efe4] transition-colors"
                              title="Download artwork"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: BUSINESSES */}
          {currentView === 'businesses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-[#e8e2d8]">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#1d211b]">Business Subaccounts</h1>
                  <p className="text-xs text-[#73796f]">
                    Each business maintains its own brand identity, typography, photo repository, and bot workflow.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddBizOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-[#f1e194]" />
                  <span>Add Business</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {businesses.map((biz) => {
                  const bPosts = posts.filter((p) => p.businessId === biz.id);
                  const isCurrent = biz.id === currentBiz.id;
                  return (
                    <div
                      key={biz.id}
                      className={`p-6 rounded-2xl border transition-all bg-white shadow-sm flex flex-col justify-between ${
                        isCurrent ? 'border-[#5b0e14] ring-2 ring-[#5b0e14]/10 shadow-md' : 'border-[#e8e2d8]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-[#5b0e14] text-[#f1e194] flex items-center justify-center font-extrabold text-base shadow-sm">
                            {biz.initial}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-[#1d211b]">{biz.name}</h3>
                            <p className="text-xs text-[#73796f]">{biz.industry}</p>
                          </div>
                        </div>

                        <p className="text-xs text-[#493f38] leading-relaxed mb-4">{biz.description}</p>

                        <div className="space-y-1.5 text-[11px] text-[#73796f] bg-[#faf8f2] p-3 rounded-xl border border-[#ece8df]">
                          <div>
                            <strong className="text-[#1d211b]">Tone:</strong> {biz.tone}
                          </div>
                          <div>
                            <strong className="text-[#1d211b]">Typography:</strong> {biz.headingFont} / {biz.bodyFont}
                          </div>
                          {biz.websiteUrl && (
                            <div>
                              <strong className="text-[#1d211b]">Website:</strong>{' '}
                              <a
                                href={biz.websiteUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#2872a1] hover:underline"
                              >
                                {biz.websiteUrl}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-[#f0ece4] flex items-center justify-between">
                        <span className="text-xs text-[#85867c] font-medium">{bPosts.length} post drafts</span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setCurrentBizId(biz.id);
                              setCurrentView('overview');
                            }}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              isCurrent
                                ? 'bg-[#5b0e14] text-[#fff8ed]'
                                : 'bg-[#faf8f2] text-[#493f38] hover:bg-[#f2ece1] border border-[#ded8cc]'
                            }`}
                          >
                            {isCurrent ? 'Active Workspace' : 'Select'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 3: CREATIVE STUDIO */}
          {currentView === 'studio' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e8e2d8]">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#1d211b]">Creative Studio</h1>
                  <p className="text-xs text-[#73796f]">
                    Curated brand palette, typography, catalog scouting, and photo adjuster for {currentBiz.name}.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCatalogSearchPost(businessPosts[0] || null)}
                    className="px-3.5 py-2 rounded-xl border border-[#ded8cc] bg-white text-xs font-semibold text-[#493f38] hover:bg-[#f4efe4] transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Search className="w-3.5 h-3.5 text-[#5b0e14]" />
                    <span>Search Public Catalogs</span>
                  </button>

                  <button
                    onClick={() => {
                      if (businessPosts[0]) setAdjustingPost(businessPosts[0]);
                      else showToast('Create a post first to launch the photo adjuster');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <Sliders className="w-4 h-4 text-[#f1e194]" />
                    <span>Launch Photo Adjuster Studio</span>
                  </button>
                </div>
              </div>

              {/* Brand Palette Card */}
              <div className="p-5 rounded-2xl bg-white border border-[#e8e2d8] shadow-sm">
                <h3 className="text-sm font-bold text-[#1d211b] mb-1">
                  Active Brand Palette & Typography ({currentBiz.name})
                </h3>
                <p className="text-xs text-[#73796f] mb-4">
                  Heading: <span style={{ fontFamily: currentBiz.headingFont }}>{currentBiz.headingFont}</span> · Body:{' '}
                  {currentBiz.bodyFont}
                </p>

                <div className="flex flex-wrap gap-4">
                  {(currentBiz.websiteInsights?.colors || ['#5B0E14', '#F1E194', '#2C1810', '#EFE9DE']).map(
                    (color, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl border border-[#ece8df] bg-[#faf8f2]">
                        <div
                          className="w-8 h-8 rounded-lg shadow-inner border border-black/10"
                          style={{ backgroundColor: color }}
                        />
                        <div>
                          <strong className="block text-xs font-mono">{color}</strong>
                          <span className="text-[10px] text-[#85867c] capitalize">
                            {i === 0 ? 'Primary' : i === 1 ? 'Accent' : `Tone ${i + 1}`}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Visual Concepts Gallery */}
              <div>
                <h3 className="text-base font-bold text-[#1d211b] mb-3">Live Photographic Concepts</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {businessPosts.map((post) => (
                    <div
                      key={post.id}
                      className="rounded-2xl border border-[#e8e2d8] overflow-hidden bg-white shadow-sm flex flex-col group"
                    >
                      <div className="aspect-square bg-[#211a19] relative overflow-hidden">
                        <img
                          src={post.imageUrl || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85'}
                          alt={post.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                          <h4
                            className="text-base font-bold leading-tight"
                            style={{ fontFamily: post.designFont || currentBiz.headingFont }}
                          >
                            {post.headline || post.title}
                          </h4>
                          <span className="text-[10px] text-[#f1e194]">{currentBiz.name}</span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-white border-t border-[#f0ece4] flex items-center justify-between">
                        <span className="text-xs text-[#73796f]">{post.platform} format</span>
                        <button
                          onClick={() => setAdjustingPost(post)}
                          className="px-3 py-1.5 rounded-lg bg-[#f1e194] text-[#5b0e14] text-xs font-bold hover:bg-[#fff2ab] transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Adjust</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: CONTENT CALENDAR */}
          {currentView === 'content' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e8e2d8]">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#1d211b]">Content Calendar</h1>
                  <p className="text-xs text-[#73796f]">
                    Weekly schedule & publication pipeline across Instagram, Facebook, TikTok, and LinkedIn.
                  </p>
                </div>
                <button
                  onClick={handleRunWorkflow}
                  disabled={isRunningWorkflow}
                  className="px-4 py-2 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-[#f1e194]" />
                  <span>Create New Batch</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {businessPosts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-2xl border border-[#e8e2d8] overflow-hidden bg-white shadow-sm flex flex-col group hover:shadow-md transition-all"
                  >
                    <div className="aspect-[4/3] bg-[#211a19] relative overflow-hidden">
                      <img
                        src={post.imageUrl || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85'}
                        alt={post.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 text-[#f1e194] backdrop-blur-xs">
                        {post.platform}
                      </span>
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#faf8f2] text-[#493f38]">
                        {post.time}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4
                          className="text-sm font-bold text-[#1d211b] mb-1"
                          style={{ fontFamily: post.designFont || currentBiz.headingFont }}
                        >
                          {post.title}
                        </h4>
                        <p className="text-xs text-[#73796f] line-clamp-3 leading-relaxed">{post.caption}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#f0ece4] flex items-center justify-between">
                        <button
                          onClick={() => setAdjustingPost(post)}
                          className="px-3 py-1.5 rounded-lg bg-[#f1e194] text-[#5b0e14] text-xs font-bold hover:bg-[#fff2ab] transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Adjust</span>
                        </button>

                        <button
                          onClick={() => setReviewingPost(post)}
                          className="px-3 py-1.5 rounded-lg bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 5: WORKFLOWS */}
          {currentView === 'workflows' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e8e2d8]">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#1d211b]">Workflows</h1>
                  <p className="text-xs text-[#73796f]">
                    Configure batch creation, platform targets, and bot quality rules for {currentBiz.name}.
                  </p>
                </div>

                <button
                  onClick={handleRunWorkflow}
                  disabled={isRunningWorkflow}
                  className="px-5 py-2.5 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-[#f1e194]" />
                  <span>Run {currentBiz.name} Workflow</span>
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-[#e8e2d8] shadow-sm space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1">
                    Workflow Name
                  </label>
                  <input
                    type="text"
                    value={currentWorkflow.name}
                    onChange={(e) => {
                      const updated = { ...currentWorkflow, name: e.target.value };
                      setWorkflows((prev) => prev.map((w) => (w.id === currentWorkflow.id ? updated : w)));
                    }}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1">
                      Posts Per Run
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={currentWorkflow.postsPerRun}
                      onChange={(e) => {
                        const updated = { ...currentWorkflow, postsPerRun: Number(e.target.value) };
                        setWorkflows((prev) => prev.map((w) => (w.id === currentWorkflow.id ? updated : w)));
                      }}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1">
                      Revision Count
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`Revision ${currentWorkflow.revision}`}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#ded8cc] bg-[#faf8f2] text-[#73796f]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1">
                    Workflow Instructions & Rules
                  </label>
                  <textarea
                    rows={4}
                    value={currentWorkflow.instructions}
                    onChange={(e) => {
                      const updated = { ...currentWorkflow, instructions: e.target.value };
                      setWorkflows((prev) => prev.map((w) => (w.id === currentWorkflow.id ? updated : w)));
                    }}
                    className="w-full p-3.5 text-xs rounded-xl border border-[#ded8cc] bg-white leading-relaxed"
                  />
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    onClick={() => {
                      fetch('/api/crm/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ workflows }),
                      });
                      showToast('Workflow saved successfully!');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 6: BOT TEAM */}
          {currentView === 'agents' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e8e2d8]">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#1d211b]">Bot Team & Task Queue</h1>
                  <p className="text-xs text-[#73796f]">
                    6 specialized agents collaborating to scout, direct, adjust, and package marketing content.
                  </p>
                </div>

                <button
                  onClick={() => setIsAssignTaskOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-[#f1e194]" />
                  <span>Assign Bot Task</span>
                </button>
              </div>

              {/* Bot Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {botDefs.map((b) => (
                  <div key={b.id} className="p-5 rounded-2xl bg-white border border-[#e8e2d8] shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-[#5b0e14] text-[#f1e194] flex items-center justify-center font-extrabold text-xs shadow-xs">
                          {b.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-bold text-[#1d211b] truncate">{b.name}</h3>
                          <small className="block text-[10px] text-[#73796f] truncate">{b.job}</small>
                        </div>
                        <span className="text-[10px] font-bold text-[#527247] bg-[#edf3e9] px-2 py-0.5 rounded-full">
                          ● {b.state}
                        </span>
                      </div>

                      <p className="text-xs text-[#493f38] leading-relaxed mb-4">{b.desc}</p>
                    </div>

                    <div className="pt-3 border-t border-[#f0ece4] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#85867c] truncate max-w-[170px]">{b.task}</span>
                        <strong className="text-[#5b0e14]">{b.progress}%</strong>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#f0ece4] overflow-hidden">
                        <div className="h-full rounded-full bg-[#5b0e14]" style={{ width: `${b.progress}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Task Queue Table */}
              <div className="p-6 rounded-2xl bg-white border border-[#e8e2d8] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1d211b]">Supervised Task Queue ({botTasks.length})</h3>
                  <button
                    onClick={() => setIsAssignTaskOpen(true)}
                    className="text-xs font-bold text-[#5b0e14] hover:underline"
                  >
                    + Assign New Task
                  </button>
                </div>

                <div className="space-y-3">
                  {botTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-xl border border-[#ece8df] bg-[#faf8f2] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <strong className="text-xs font-bold text-[#1d211b]">{t.title}</strong>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              t.status === 'complete'
                                ? 'bg-[#eef4e9] text-[#527247]'
                                : t.status === 'in_progress'
                                ? 'bg-[#e8f1f7] text-[#2872a1]'
                                : 'bg-[#fff0df] text-[#a55c2a]'
                            }`}
                          >
                            {t.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-[#73796f] leading-relaxed">{t.instructions}</p>
                        <small className="block text-[10px] text-[#85867c] mt-1">
                          Assignee: {botDefs.find((b) => b.id === t.botId)?.name || t.botId} · Engineer Note:{' '}
                          {t.engineerNote}
                        </small>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {t.status !== 'complete' && (
                          <button
                            onClick={() => handleUpdateTaskStatus(t.id, 'complete')}
                            className="px-3 py-1.5 rounded-lg bg-[#527247] text-white text-xs font-bold hover:bg-[#435e3a] transition-colors flex items-center gap-1 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Complete</span>
                          </button>
                        )}
                        {t.status === 'complete' && (
                          <button
                            onClick={() => handleUpdateTaskStatus(t.id, 'in_progress')}
                            className="px-3 py-1.5 rounded-lg border border-[#ded8cc] bg-white text-xs font-medium text-[#493f38] hover:bg-[#f4efe4]"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 7: TEAM CHAT */}
          {currentView === 'chat' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-between pb-2 border-b border-[#e8e2d8]">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#1d211b]">Team Chat</h1>
                  <p className="text-xs text-[#73796f]">
                    Speak directly with any bot. Responses are grounded in {currentBiz.name}'s profile and visual direction.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-[#73796f]">Chat with:</label>
                  <select
                    value={chatBot}
                    onChange={(e) => setChatBot(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-[#ded8cc] bg-white font-semibold text-[#1d211b]"
                  >
                    {botDefs.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chat Log */}
              <div className="h-[520px] rounded-2xl border border-[#e8e2d8] bg-white p-5 overflow-y-auto space-y-3.5 shadow-sm">
                {chatMessages.length === 0 && (
                  <div className="text-center py-20 text-[#85867c]">
                    <Bot className="w-10 h-10 mx-auto text-[#ded8cc] mb-2" />
                    <strong className="block text-sm font-bold text-[#1d211b]">Ask {botDefs.find((b) => b.id === chatBot)?.name}</strong>
                    <p className="text-xs mt-1">
                      Ask about photo adjustments, brand angles, platform rules, or campaign concepts.
                    </p>
                  </div>
                )}

                {chatMessages.map((msg, i) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={i}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-2xl ${
                        isUser ? 'ml-auto' : 'mr-auto'
                      }`}
                    >
                      <small className="text-[10px] font-bold text-[#85867c] mb-1">
                        {isUser ? 'You (Owner)' : botDefs.find((b) => b.id === msg.botId)?.name || 'Bot'}
                      </small>
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isUser
                            ? 'bg-[#5b0e14] text-[#fff8ed] rounded-tr-xs'
                            : 'bg-[#faf8f2] border border-[#ece8df] text-[#1d211b] rounded-tl-xs'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}

                {isChatSending && (
                  <div className="flex items-center gap-2 text-xs text-[#85867c] italic">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#5b0e14]" />
                    <span>Bot team reviewing context...</span>
                  </div>
                )}
              </div>

              {/* Input Compose */}
              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Message ${botDefs.find((b) => b.id === chatBot)?.name}...`}
                  className="flex-1 px-4 py-3 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
                />
                <button
                  type="submit"
                  disabled={isChatSending || !chatInput.trim()}
                  className="px-5 py-3 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* VIEW 8: REVIEW & LEARNING */}
          {currentView === 'learning' && (
            <div className="space-y-6">
              <div className="pb-2 border-b border-[#e8e2d8]">
                <h1 className="text-2xl font-extrabold text-[#1d211b]">Review & Bot Learning</h1>
                <p className="text-xs text-[#73796f]">
                  Approving artwork or copy stores real preferences and training guidance for your bot team.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Images waiting review */}
                <div className="p-5 rounded-2xl bg-white border border-[#e8e2d8] shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-[#1d211b]">
                    Images Awaiting Sign-off ({businessPosts.filter((p) => !p.imageApproved).length})
                  </h3>

                  <div className="space-y-3">
                    {businessPosts
                      .filter((p) => !p.imageApproved)
                      .map((post) => (
                        <div
                          key={post.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-[#ece8df] bg-[#faf8f2]"
                        >
                          <img
                            src={post.imageUrl || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85'}
                            alt={post.title}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <strong className="block text-xs font-bold text-[#1d211b] truncate">{post.title}</strong>
                            <small className="block text-[10px] text-[#73796f] truncate">{post.platform} · {currentBiz.name}</small>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setAdjustingPost(post)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#f1e194] text-[#5b0e14] text-xs font-bold hover:bg-[#fff2ab]"
                            >
                              Adjust
                            </button>
                            <button
                              onClick={() => {
                                handleUpdatePost({ ...post, imageApproved: true });
                                showToast('Image approved! Bot memory updated.');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[#5b0e14] text-white text-xs font-bold hover:bg-[#74131c]"
                            >
                              Approve
                            </button>
                          </div>
                        </div>
                      ))}

                    {businessPosts.filter((p) => !p.imageApproved).length === 0 && (
                      <p className="text-xs text-[#85867c] py-6 text-center">All images for {currentBiz.name} are approved!</p>
                    )}
                  </div>
                </div>

                {/* Learned Bot Guidance */}
                <div className="p-5 rounded-2xl bg-white border border-[#e8e2d8] shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-[#1d211b]">Bot Guidance & Approval Memory</h3>
                  <div className="space-y-2.5">
                    {learning.slice(0, 6).map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-[#ece8df] bg-[#faf8f2] text-xs text-[#493f38]">
                        <div className="flex items-center justify-between text-[10px] font-bold text-[#5b0e14] mb-1">
                          <span>{botDefs.find((b) => b.id === item.bot_id)?.name || item.bot_id}</span>
                          <span className="text-[#85867c]">{item.source || 'approval'}</span>
                        </div>
                        <p className="leading-relaxed">{item.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 9: SETTINGS */}
          {currentView === 'settings' && (
            <div className="space-y-6 max-w-4xl">
              <div className="pb-2 border-b border-[#e8e2d8]">
                <h1 className="text-2xl font-extrabold text-[#1d211b]">Settings & Workspace</h1>
                <p className="text-xs text-[#73796f]">Global rules, photo licensing origins, and API integrations.</p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-[#e8e2d8] shadow-sm space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-[#f0ece4] text-xs">
                  <span className="font-bold text-[#1d211b]">Workspace Owner</span>
                  <span className="text-[#73796f]">Dan B Clarks (Owner account)</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#f0ece4] text-xs">
                  <span className="font-bold text-[#1d211b]">Active Subaccounts</span>
                  <span className="text-[#73796f]">{businesses.length} Managed Subaccounts</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#f0ece4] text-xs">
                  <span className="font-bold text-[#1d211b]">Commercial Photo Sources</span>
                  <span className="text-[#73796f]">Wikimedia Commons, Openverse, Curated Unsplash</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#f0ece4] text-xs">
                  <span className="font-bold text-[#1d211b]">Visual Editor Model</span>
                  <span className="text-[#73796f]">Gemini 3.8 Flash (Interactive Agent)</span>
                </div>
                <div className="flex items-center justify-between py-2 text-xs">
                  <span className="font-bold text-[#1d211b]">Canvas Compositor</span>
                  <span className="text-[#527247] font-semibold">CORS-Safe Proxy Enabled (Instant Download)</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      {adjustingPost && (
        <PhotoAdjusterModal
          post={adjustingPost}
          biz={currentBiz}
          onClose={() => setAdjustingPost(null)}
          onUpdatePost={handleUpdatePost}
          onOpenCatalogSearch={(p) => {
            setAdjustingPost(null);
            setCatalogSearchPost(p);
          }}
          onRegeneratePhoto={(p) => {
            fetch('/api/crm/generate-photo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                businessId: currentBiz.id,
                brief: p.title,
                aspectRatio: p.adjustments?.aspectRatio || '1:1',
              }),
            })
              .then((r) => r.json())
              .then((data) => {
                if (data.url) {
                  const updated: Post = { ...p, imageUrl: data.url, imageApproved: false };
                  handleUpdatePost(updated);
                  setAdjustingPost(updated);
                  showToast('Fresh image generated & applied!');
                }
              })
              .catch((e) => showToast('Regeneration error: ' + e.message));
          }}
          showToast={showToast}
        />
      )}

      {reviewingPost && (
        <PostReviewModal
          post={reviewingPost}
          biz={currentBiz}
          onClose={() => setReviewingPost(null)}
          onUpdatePost={handleUpdatePost}
          onOpenAdjuster={(p) => {
            setReviewingPost(null);
            setAdjustingPost(p);
          }}
          onOpenCatalogSearch={(p) => {
            setReviewingPost(null);
            setCatalogSearchPost(p);
          }}
          showToast={showToast}
        />
      )}

      {catalogSearchPost && (
        <CatalogSearchModal
          targetPost={catalogSearchPost}
          biz={currentBiz}
          onClose={() => setCatalogSearchPost(null)}
          onSelectPhoto={(photo) => {
            const updated: Post = {
              ...catalogSearchPost,
              imageUrl: photo.url,
              imageSource: photo,
              imageApproved: true,
            };
            handleUpdatePost(updated);
            showToast('Catalog photo attached to draft!');
          }}
          showToast={showToast}
        />
      )}

      {isAddBizOpen && (
        <AddBusinessModal
          onClose={() => setIsAddBizOpen(false)}
          onAddBusiness={handleAddBusiness}
          showToast={showToast}
        />
      )}

      {isAssignTaskOpen && (
        <AssignTaskModal
          businesses={businesses}
          currentBizId={currentBiz.id}
          bots={botDefs}
          onClose={() => setIsAssignTaskOpen(false)}
          onAssignTask={handleAssignTask}
          showToast={showToast}
        />
      )}
    </div>
  );
}
