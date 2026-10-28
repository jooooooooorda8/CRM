export interface Business {
  id: string;
  name: string;
  industry: string;
  initial: string;
  theme: string;
  headingFont: string;
  bodyFont: string;
  tone: string;
  audience: string;
  channels: string[];
  description: string;
  websiteUrl?: string;
  websiteInsights?: {
    title?: string;
    description?: string;
    colors?: string[];
    fonts?: string[];
    fetchedAt?: string;
  };
  businessProfile?: {
    offer?: string;
    differentiator?: string;
    audience?: string;
    goal?: string;
    callToAction?: string;
    brandVoice?: string;
    serviceArea?: string;
    restrictions?: string;
    regulatoryNotes?: string;
    visualDirection?: string;
    channels?: string[];
  };
  createdAt?: string;
}

export interface PhotoAdjustments {
  brightness: number; // 80 - 140
  contrast: number; // 80 - 150
  saturation: number; // 50 - 160
  warmth: number; // -30 to 30
  vignette: number; // 0 to 60
  aspectRatio: '1:1' | '4:5' | '9:16' | '16:9';
  movement: 'editorial' | 'minimalist' | 'brutalism' | 'glassmorphism' | 'claymorphism' | 'retro-y2k' | 'bento';
  overlayStyle: 'classic' | 'quiet' | 'bold-badge' | 'split' | 'minimal';
}

export interface Post {
  id: string;
  businessId: string;
  platform: string;
  time: string;
  status: string;
  title: string;
  caption: string;
  tone?: string;
  art?: string;
  headline?: string;
  sub?: string;
  designFont?: string;
  designPalette?: [string, string];
  imageUrl?: string;
  imageSource?: {
    type?: string;
    provider?: string;
    id?: string;
    title?: string;
    creator?: string;
    license?: string;
    licenseUrl?: string;
    foreign_landing_url?: string;
    attribution?: string;
  };
  imageApproved?: boolean;
  contentApproved?: boolean;
  visualReview?: {
    approved: boolean;
    score: number;
    notes: string;
    revisionDirection: string;
  };
  copyReviewStatus?: string;
  adjustments?: PhotoAdjustments;
  imageError?: boolean;
  imageProgress?: number;
  imageStatus?: string;
  createdAt?: string;
  downloadedAt?: string;
}

export interface BotTask {
  id: string;
  businessId: string;
  botId: string;
  title: string;
  instructions: string;
  status: 'queued' | 'in_progress' | 'needs_review' | 'complete';
  progress: number;
  priority: 'normal' | 'high' | 'urgent';
  engineerNote?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface Workflow {
  id: string;
  businessId: string;
  name: string;
  postsPerRun: number;
  channels: string[];
  instructions: string;
  revision: number;
  lastRunAt?: string;
  engineerNote?: string;
}

export interface BotDef {
  id: string;
  icon: string;
  name: string;
  job: string;
  state: string;
  desc: string;
  task: string;
  progress: number;
}
