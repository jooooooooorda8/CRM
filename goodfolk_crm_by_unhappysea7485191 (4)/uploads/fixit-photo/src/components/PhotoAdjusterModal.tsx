import React, { useState } from 'react';
import { Post, Business, PhotoAdjustments } from '../types';
import { composeAndDownloadArtwork } from '../utils/canvasExporter';
import {
  Sparkles,
  Sliders,
  Maximize2,
  Type,
  Download,
  Check,
  X,
  RefreshCw,
  Upload,
  Search,
  Wand2,
  Layers,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';

interface Props {
  post: Post;
  biz: Business;
  onClose: () => void;
  onUpdatePost: (updated: Post) => void;
  onOpenCatalogSearch: (post: Post) => void;
  onRegeneratePhoto: (post: Post) => void;
  showToast: (msg: string) => void;
}

const fontOptions = [
  'DM Serif Display',
  'Cormorant Garamond',
  'Space Grotesk',
  'Playfair Display',
  'Libre Baskerville',
  'Outfit',
  'Bitter',
  'Lora',
  'Raleway',
  'Oswald',
  'Nunito Sans',
  'Urbanist',
  'Merriweather',
  'Crimson Text',
  'Montserrat',
  'Lato',
  'Poppins',
  'Rubik',
  'Josefin Sans',
  'Bodoni Moda',
  'Sora',
  'Archivo',
  'Fraunces',
  'Barlow Condensed',
];

export const PhotoAdjusterModal: React.FC<Props> = ({
  post,
  biz,
  onClose,
  onUpdatePost,
  onOpenCatalogSearch,
  onRegeneratePhoto,
  showToast,
}) => {
  const initialAdjustments: PhotoAdjustments = post.adjustments || {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    warmth: 0,
    vignette: 10,
    aspectRatio: '1:1',
    movement: 'editorial',
    overlayStyle: 'classic',
  };

  const [adjustments, setAdjustments] = useState<PhotoAdjustments>(initialAdjustments);
  const [headline, setHeadline] = useState(post.headline || post.title || biz.name);
  const [selectedFont, setSelectedFont] = useState(post.designFont || biz.headingFont || 'DM Serif Display');
  const [botPrompt, setBotPrompt] = useState('');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [botMessage, setBotMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'bot' | 'filters' | 'layout' | 'typography'>('bot');

  // Compute live CSS filter string
  const filterString = [
    `brightness(${adjustments.brightness}%)`,
    `contrast(${adjustments.contrast}%)`,
    `saturate(${adjustments.saturation}%)`,
    adjustments.warmth > 0 ? `sepia(${Math.min(adjustments.warmth * 1.5, 45)}%)` : '',
    adjustments.warmth < 0 ? `hue-rotate(${adjustments.warmth * 0.5}deg)` : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Aspect ratio classes for preview
  const aspectClass = {
    '1:1': 'aspect-square max-w-[460px]',
    '4:5': 'aspect-[4/5] max-w-[380px]',
    '9:16': 'aspect-[9/16] max-w-[300px]',
    '16:9': 'aspect-[16/9] max-w-[520px]',
  }[adjustments.aspectRatio];

  const primaryColor = post.designPalette?.[0] || biz.websiteInsights?.colors?.[0] || '#5B0E14';
  const accentColor = post.designPalette?.[1] || biz.websiteInsights?.colors?.[1] || '#F1E194';

  const handleBotAdjust = async (instructionText?: string) => {
    const promptToSend = instructionText || botPrompt;
    if (!promptToSend.trim()) return;

    setIsBotThinking(true);
    setBotMessage(null);

    try {
      const res = await fetch('/api/crm/adjust-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          adjustments,
          botInstruction: promptToSend,
        }),
      });

      if (!res.ok) throw new Error('Bot adjustment failed');
      const data = await res.json();

      if (data.adjustments) {
        setAdjustments(data.adjustments);
      }
      if (data.post?.designFont) {
        setSelectedFont(data.post.designFont);
      }
      setBotMessage(data.feedback || 'Adjustments calculated by Visual Editor bot.');
      showToast('Visual Editor bot applied adjustments!');
    } catch (e: any) {
      showToast('Visual Editor adjustment error: ' + (e.message || 'Unknown'));
    } finally {
      setIsBotThinking(false);
      setBotPrompt('');
    }
  };

  const handleApplyPreset = (preset: string) => {
    switch (preset) {
      case 'golden':
        setAdjustments((prev) => ({
          ...prev,
          brightness: 104,
          contrast: 105,
          saturation: 110,
          warmth: 18,
          vignette: 15,
        }));
        showToast('Preset: Warm Golden Hour');
        break;
      case 'moody':
        setAdjustments((prev) => ({
          ...prev,
          brightness: 92,
          contrast: 125,
          saturation: 90,
          warmth: -5,
          vignette: 35,
        }));
        showToast('Preset: Moody Noir');
        break;
      case 'vibrant':
        setAdjustments((prev) => ({
          ...prev,
          brightness: 102,
          contrast: 115,
          saturation: 135,
          warmth: 5,
          vignette: 10,
        }));
        showToast('Preset: Vibrant Editorial');
        break;
      case 'clean':
        setAdjustments((prev) => ({
          ...prev,
          brightness: 102,
          contrast: 100,
          saturation: 98,
          warmth: 0,
          vignette: 5,
        }));
        showToast('Preset: Clean & Crisp');
        break;
      case 'vintage':
        setAdjustments((prev) => ({
          ...prev,
          brightness: 98,
          contrast: 110,
          saturation: 85,
          warmth: 24,
          vignette: 25,
        }));
        showToast('Preset: Vintage Film');
        break;
      default:
        setAdjustments(initialAdjustments);
        showToast('Preset: Reset to Original');
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await composeAndDownloadArtwork(
        { ...post, designFont: selectedFont, headline },
        biz,
        adjustments,
        headline
      );
      showToast('Finished artwork downloaded successfully!');
    } catch (err: any) {
      showToast('Download error: ' + (err.message || 'Failed'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveAndApprove = () => {
    const updated: Post = {
      ...post,
      headline,
      designFont: selectedFont,
      adjustments,
      imageApproved: true,
      visualReview: {
        approved: true,
        score: 10,
        notes: `Adjusted and approved by owner with Visual Editor bot (${adjustments.aspectRatio}, ${adjustments.movement}).`,
        revisionDirection: 'Optimal composition saved for production.',
      },
    };
    onUpdatePost(updated);
    showToast('Photo adjustments saved & approved!');
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      showToast('Uploading custom replacement photo...');
      const res = await fetch(`/api/crm/post-image`, {
        method: 'POST',
        headers: {
          'x-content-id': post.id,
          'x-filename': file.name,
          'content-type': file.type,
        },
        body: file,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      const updated: Post = {
        ...post,
        imageUrl: data.url,
        imageApproved: true,
      };
      onUpdatePost(updated);
      showToast('Replacement photo uploaded & attached!');
    } catch (err: any) {
      showToast('Upload error: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#fffdf9] border border-[#e8e2d8] rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden text-[#1d211b]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e2d8] bg-[#fcfaf4]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5b0e14] text-[#f1e194] flex items-center justify-center font-bold text-xs shadow-sm">
              VE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-[#1d211b]">Visual Editor Studio</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#eef4e9] text-[#527247] border border-[#d6e3ce]">
                  Interactive Bot Adjuster
                </span>
              </div>
              <p className="text-xs text-[#73796f]">
                {biz.name} · {post.platform} · {post.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenCatalogSearch(post)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#ded8cc] bg-white text-xs font-medium text-[#493f38] hover:bg-[#f4efe4] transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-[#5b0e14]" />
              <span>Search Catalogs</span>
            </button>

            <button
              onClick={() => onRegeneratePhoto(post)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#ded8cc] bg-white text-xs font-medium text-[#493f38] hover:bg-[#f4efe4] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#2872a1]" />
              <span>Regenerate Image</span>
            </button>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#ded8cc] bg-white text-xs font-medium text-[#493f38] hover:bg-[#f4efe4] cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-[#fd802e]" />
              <span>Upload Custom</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#85867c] hover:bg-[#f2ece1] hover:text-[#1d211b] transition-colors ml-2"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Two Column (Preview Canvas & Control Deck) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden min-h-0">
          {/* Left: Interactive Canvas Preview */}
          <div className="lg:col-span-7 bg-[#211a19] p-6 flex flex-col items-center justify-center relative overflow-auto border-r border-[#3a2c2c]/40">
            {/* Aspect Ratio Badge & Dimension */}
            <div className="absolute top-4 left-6 flex items-center gap-2 z-20">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-black/60 backdrop-blur-md text-[#f1e194] border border-white/10">
                {adjustments.aspectRatio} Aspect
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-black/40 text-white/80">
                Style: {adjustments.movement}
              </span>
            </div>

            {/* Canvas Container */}
            <div
              className={`relative rounded-xl overflow-hidden shadow-2xl transition-all duration-300 w-full ${aspectClass} border border-white/10`}
            >
              {/* Filtered Background Image */}
              <img
                src={post.imageUrl || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85'}
                alt={post.title}
                referrerPolicy="no-referrer"
                style={{ filter: filterString }}
                className="w-full h-full object-cover transition-all duration-200"
              />

              {/* Vignette Shadow Overlay */}
              {adjustments.vignette > 0 && (
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity"
                  style={{
                    background: `radial-gradient(circle at center, transparent 35%, rgba(0,0,0,${
                      (adjustments.vignette / 100) * 0.85
                    }) 100%)`,
                  }}
                />
              )}

              {/* Bottom Gradient Veil */}
              <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

              {/* Artwork Overlays by Movement */}
              {adjustments.movement === 'brutalism' && (
                <div className="absolute inset-x-4 bottom-4 p-4 border-2 border-black shadow-[4px_4px_0px_#000000] z-10" style={{ backgroundColor: primaryColor }}>
                  <div className="h-1.5 w-full mb-3" style={{ backgroundColor: accentColor }} />
                  <h3
                    className="text-lg sm:text-xl font-bold tracking-tight text-white uppercase leading-snug"
                    style={{ fontFamily: selectedFont }}
                  >
                    {headline}
                  </h3>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20 text-[10px] font-bold tracking-wider" style={{ color: accentColor }}>
                    <span>{biz.name.toUpperCase()}</span>
                    <span>{post.platform.toUpperCase()}</span>
                  </div>
                </div>
              )}

              {adjustments.movement === 'glassmorphism' && (
                <div className="absolute inset-x-4 bottom-4 p-4 rounded-xl backdrop-blur-md bg-white/15 border border-white/30 shadow-lg text-white z-10">
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mb-2 text-[#1d211b]"
                    style={{ backgroundColor: accentColor }}
                  >
                    {biz.name}
                  </span>
                  <h3
                    className="text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-sm leading-snug"
                    style={{ fontFamily: selectedFont }}
                  >
                    {headline}
                  </h3>
                  <p className="text-[11px] text-white/80 mt-1 line-clamp-1">{post.sub || biz.description}</p>
                </div>
              )}

              {adjustments.movement !== 'brutalism' && adjustments.movement !== 'glassmorphism' && (
                <div className="absolute inset-x-5 bottom-5 text-white z-10">
                  <div className="w-10 h-1 mb-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
                  <h3
                    className="text-lg sm:text-2xl font-bold tracking-tight text-white leading-tight drop-shadow-md"
                    style={{ fontFamily: selectedFont }}
                  >
                    {headline}
                  </h3>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/20 text-xs font-medium text-white/90">
                    <span className="font-semibold tracking-wide uppercase text-[10px]">{biz.name}</span>
                    <span className="text-[10px] font-bold tracking-wider" style={{ color: accentColor }}>
                      {post.platform.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Presets on Canvas */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center z-20">
              <button
                onClick={() => handleApplyPreset('clean')}
                className="px-2.5 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                Clean & Crisp
              </button>
              <button
                onClick={() => handleApplyPreset('golden')}
                className="px-2.5 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 text-[#f1e194] font-medium transition-colors"
              >
                Golden Hour
              </button>
              <button
                onClick={() => handleApplyPreset('moody')}
                className="px-2.5 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                Moody Noir
              </button>
              <button
                onClick={() => handleApplyPreset('vibrant')}
                className="px-2.5 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 text-[#fd802e] font-medium transition-colors"
              >
                Vibrant Pop
              </button>
              <button
                onClick={() => handleApplyPreset('vintage')}
                className="px-2.5 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 text-[#acc8a2] font-medium transition-colors"
              >
                Vintage Film
              </button>
              <button
                onClick={() => handleApplyPreset('reset')}
                className="px-2.5 py-1 text-xs rounded-full bg-white/5 hover:bg-white/15 text-white/60 font-medium transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Right: Adjustment Controls & Visual Editor Bot Command Center */}
          <div className="lg:col-span-5 flex flex-col bg-[#fffdf9] overflow-y-auto">
            {/* Tabs */}
            <div className="flex border-b border-[#e8e2d8] px-4 bg-[#fcfaf4]">
              <button
                onClick={() => setActiveTab('bot')}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'bot'
                    ? 'border-[#5b0e14] text-[#5b0e14]'
                    : 'border-transparent text-[#73796f] hover:text-[#1d211b]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Visual Editor Bot</span>
              </button>
              <button
                onClick={() => setActiveTab('layout')}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'layout'
                    ? 'border-[#5b0e14] text-[#5b0e14]'
                    : 'border-transparent text-[#73796f] hover:text-[#1d211b]'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Aspect & Style</span>
              </button>
              <button
                onClick={() => setActiveTab('filters')}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'filters'
                    ? 'border-[#5b0e14] text-[#5b0e14]'
                    : 'border-transparent text-[#73796f] hover:text-[#1d211b]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Lighting & Color</span>
              </button>
              <button
                onClick={() => setActiveTab('typography')}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'typography'
                    ? 'border-[#5b0e14] text-[#5b0e14]'
                    : 'border-transparent text-[#73796f] hover:text-[#1d211b]'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Typography</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 flex-1 space-y-6">
              {/* TAB 1: Visual Editor Bot AI */}
              {activeTab === 'bot' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[#421017] to-[#5b0e14] text-[#fff8ed] shadow-md">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-4 h-4 text-[#f1e194]" />
                      <h4 className="text-sm font-bold text-[#f1e194]">Ask Visual Editor Bot</h4>
                    </div>
                    <p className="text-xs text-[#eadbd4] leading-relaxed">
                      Describe how you want to adjust this image. The bot calculates optimal lighting, crop ratios,
                      typography, and design movement for {post.platform}.
                    </p>

                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={botPrompt}
                        onChange={(e) => setBotPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleBotAdjust()}
                        placeholder="e.g. Make it moody with warm shadows and bold serif typography..."
                        className="flex-1 px-3 py-2 text-xs rounded-lg bg-white text-[#1d211b] placeholder:text-[#8a887b] focus:outline-none focus:ring-2 focus:ring-[#f1e194]"
                      />
                      <button
                        onClick={() => handleBotAdjust()}
                        disabled={isBotThinking || !botPrompt.trim()}
                        className="px-3.5 py-2 rounded-lg bg-[#f1e194] text-[#5b0e14] font-bold text-xs hover:bg-[#fff2ab] disabled:opacity-50 transition-colors flex items-center gap-1.5"
                      >
                        {isBotThinking ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Wand2 className="w-3.5 h-3.5" />
                        )}
                        <span>Adjust</span>
                      </button>
                    </div>
                  </div>

                  {botMessage && (
                    <div className="p-3.5 rounded-xl bg-[#eef4e9] border border-[#d6e3ce] text-[#2c3d25] text-xs leading-relaxed animate-fade-in flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#527247] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        VE
                      </span>
                      <div>
                        <strong className="block text-[#1a2517] font-semibold mb-0.5">Visual Editor Bot:</strong>
                        <span>{botMessage}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-2">
                      Quick Bot Adjustments
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { label: 'TikTok 9:16 Story Crop', cmd: 'Crop 9:16 for TikTok with punchy contrast and bold headline' },
                        { label: 'Moody Cinematic Coffee', cmd: 'Deepen shadows, rich warmth, gentle vignette, DM Serif Display' },
                        { label: 'Frosted Glassmorphism', cmd: 'Apply glassmorphism overlay with soft translucent badge' },
                        { label: 'Brutalist High Impact', cmd: 'Bold brutalist card with strong borders and punchy typography' },
                        { label: 'Scandinavian Minimal', cmd: 'Soft natural light, lowered contrast, elegant subtle type' },
                        { label: 'Golden Morning Light', cmd: 'Boost golden warmth and gentle highlights for breakfast feel' },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleBotAdjust(item.cmd)}
                          disabled={isBotThinking}
                          className="p-2.5 rounded-xl border border-[#e8e2d8] hover:border-[#5b0e14] hover:bg-[#fffcf7] text-left text-xs transition-all group"
                        >
                          <strong className="block text-[#1d211b] group-hover:text-[#5b0e14] font-semibold">
                            {item.label}
                          </strong>
                          <span className="text-[10px] text-[#85867c] line-clamp-1">{item.cmd}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Aspect Ratio & Design Movement */}
              {activeTab === 'layout' && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-2">
                      Aspect Ratio
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { ratio: '1:1', label: '1:1 Square', sub: 'Instagram Feed' },
                        { ratio: '4:5', label: '4:5 Portrait', sub: 'IG / FB Feed' },
                        { ratio: '9:16', label: '9:16 Story', sub: 'TikTok / Reels' },
                        { ratio: '16:9', label: '16:9 Wide', sub: 'LinkedIn / Web' },
                      ].map((item) => (
                        <button
                          key={item.ratio}
                          onClick={() =>
                            setAdjustments((prev) => ({ ...prev, aspectRatio: item.ratio as any }))
                          }
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            adjustments.aspectRatio === item.ratio
                              ? 'border-[#5b0e14] bg-[#fbf5f2] text-[#5b0e14] font-bold shadow-sm'
                              : 'border-[#e8e2d8] bg-white text-[#493f38] hover:bg-[#faf6ee]'
                          }`}
                        >
                          <span className="block text-xs">{item.label}</span>
                          <span className="block text-[9px] text-[#85867c] mt-0.5">{item.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-2">
                      Design Movement & Card Style
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'editorial', label: 'Editorial Classic', desc: 'Elegant gradient bar & fine serif' },
                        { id: 'glassmorphism', label: 'Glassmorphism', desc: 'Translucent frosted glass card' },
                        { id: 'brutalism', label: 'Neo-Brutalism', desc: 'Solid black stroke & bold badge' },
                        { id: 'minimalist', label: 'Minimalist Serene', desc: 'Clean quiet type & natural look' },
                        { id: 'claymorphism', label: 'Claymorphic', desc: 'Soft pillowy rounded cards' },
                        { id: 'retro-y2k', label: 'Retro Y2K', desc: 'Warm chromatic nostalgic accents' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() =>
                            setAdjustments((prev) => ({ ...prev, movement: item.id as any }))
                          }
                          className={`p-3 rounded-xl border text-left transition-all ${
                            adjustments.movement === item.id
                              ? 'border-[#5b0e14] bg-[#fbf5f2] text-[#5b0e14] font-bold shadow-sm'
                              : 'border-[#e8e2d8] bg-white text-[#493f38] hover:bg-[#faf6ee]'
                          }`}
                        >
                          <strong className="block text-xs">{item.label}</strong>
                          <span className="block text-[10px] text-[#85867c] mt-0.5">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Lighting, Filters & Sliders */}
              {activeTab === 'filters' && (
                <div className="space-y-4">
                  {/* Brightness */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1 text-[#493f38]">
                      <span>Brightness</span>
                      <span>{adjustments.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="80"
                      max="140"
                      value={adjustments.brightness}
                      onChange={(e) =>
                        setAdjustments((prev) => ({ ...prev, brightness: Number(e.target.value) }))
                      }
                      className="w-full accent-[#5b0e14]"
                    />
                  </div>

                  {/* Contrast */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1 text-[#493f38]">
                      <span>Contrast</span>
                      <span>{adjustments.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="80"
                      max="150"
                      value={adjustments.contrast}
                      onChange={(e) =>
                        setAdjustments((prev) => ({ ...prev, contrast: Number(e.target.value) }))
                      }
                      className="w-full accent-[#5b0e14]"
                    />
                  </div>

                  {/* Saturation */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1 text-[#493f38]">
                      <span>Saturation</span>
                      <span>{adjustments.saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="160"
                      value={adjustments.saturation}
                      onChange={(e) =>
                        setAdjustments((prev) => ({ ...prev, saturation: Number(e.target.value) }))
                      }
                      className="w-full accent-[#5b0e14]"
                    />
                  </div>

                  {/* Warmth */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1 text-[#493f38]">
                      <span>Color Warmth</span>
                      <span>{adjustments.warmth > 0 ? `+${adjustments.warmth}` : adjustments.warmth}</span>
                    </div>
                    <input
                      type="range"
                      min="-30"
                      max="30"
                      value={adjustments.warmth}
                      onChange={(e) =>
                        setAdjustments((prev) => ({ ...prev, warmth: Number(e.target.value) }))
                      }
                      className="w-full accent-[#5b0e14]"
                    />
                  </div>

                  {/* Vignette */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1 text-[#493f38]">
                      <span>Vignette Edge Shadow</span>
                      <span>{adjustments.vignette}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={adjustments.vignette}
                      onChange={(e) =>
                        setAdjustments((prev) => ({ ...prev, vignette: Number(e.target.value) }))
                      }
                      className="w-full accent-[#5b0e14]"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: Typography & Overlay Text */}
              {activeTab === 'typography' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1">
                      Overlay Headline
                    </label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Headline text on artwork..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1">
                      Headline Font Family
                    </label>
                    <select
                      value={selectedFont}
                      onChange={(e) => setSelectedFont(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
                    >
                      {fontOptions.map((f) => (
                        <option key={f} value={f} style={{ fontFamily: f }}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#f5f1e9] border border-[#e8e2d8]">
                    <span className="text-[11px] font-bold text-[#73796f] uppercase tracking-wider block mb-2">
                      Brand Palette Attached
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-md shadow-sm border border-black/10" style={{ backgroundColor: primaryColor }} />
                        <span className="text-xs font-mono">{primaryColor}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-md shadow-sm border border-black/10" style={{ backgroundColor: accentColor }} />
                        <span className="text-xs font-mono">{accentColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-[#e8e2d8] bg-[#fcfaf4] flex items-center justify-between gap-3">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="px-4 py-2.5 rounded-xl border border-[#ded8cc] bg-white text-xs font-bold text-[#493f38] hover:bg-[#f4efe4] transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-[#5b0e14]" />
                <span>{isDownloading ? 'Compositing...' : 'Download Artwork'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#ded8cc] text-xs font-semibold text-[#73796f] hover:bg-[#f4efe4] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAndApprove}
                  className="px-5 py-2.5 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-[#f1e194]" />
                  <span>Save & Approve</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
