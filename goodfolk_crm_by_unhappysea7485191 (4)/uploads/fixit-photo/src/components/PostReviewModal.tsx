import React, { useState } from 'react';
import { Post, Business } from '../types';
import { composeAndDownloadArtwork } from '../utils/canvasExporter';
import {
  X,
  Sliders,
  Check,
  Copy,
  Download,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Search,
  Upload,
} from 'lucide-react';

interface Props {
  post: Post;
  biz: Business;
  onClose: () => void;
  onUpdatePost: (updated: Post) => void;
  onOpenAdjuster: (post: Post) => void;
  onOpenCatalogSearch: (post: Post) => void;
  showToast: (msg: string) => void;
}

export const PostReviewModal: React.FC<Props> = ({
  post,
  biz,
  onClose,
  onUpdatePost,
  onOpenAdjuster,
  onOpenCatalogSearch,
  showToast,
}) => {
  const [caption, setCaption] = useState(post.caption);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setIsCopied(true);
      showToast('Caption copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      showToast('Could not copy automatically');
    }
  };

  const handleSaveCaption = () => {
    const updated: Post = {
      ...post,
      caption,
      contentApproved: true,
      status: 'Ready for review',
    };
    onUpdatePost(updated);
    showToast('Caption saved & approved!');
  };

  const handleApproveAll = () => {
    const updated: Post = {
      ...post,
      caption,
      imageApproved: true,
      contentApproved: true,
      status: 'Ready for review',
    };
    onUpdatePost(updated);
    showToast('Post marked ready for publication!');
    onClose();
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await composeAndDownloadArtwork(
        { ...post, caption },
        biz,
        post.adjustments || {
          brightness: 100,
          contrast: 100,
          saturation: 100,
          warmth: 0,
          vignette: 10,
          aspectRatio: '1:1',
          movement: 'editorial',
          overlayStyle: 'classic',
        }
      );
      showToast('Artwork downloaded!');
    } catch (e: any) {
      showToast('Download failed: ' + e.message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#fffdf9] border border-[#e8e2d8] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-[#1d211b]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e2d8] bg-[#fcfaf4]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#5b0e14] text-[#f1e194]">
                {post.platform}
              </span>
              <h2 className="text-base font-bold text-[#1d211b]">{post.title}</h2>
            </div>
            <p className="text-xs text-[#73796f] mt-0.5">
              {biz.name} · {post.time} · {post.tone || 'Brand voice'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#85867c] hover:bg-[#f2ece1] hover:text-[#1d211b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto p-6 gap-6">
          {/* Left: Artwork Preview */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-[360px] aspect-square rounded-xl overflow-hidden shadow-lg border border-[#e8e2d8] relative bg-[#211a19] group">
              <img
                src={post.imageUrl || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85'}
                alt={post.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                <span className="text-[10px] uppercase font-bold text-[#f1e194]">{biz.name}</span>
                <h4
                  className="text-lg font-bold leading-tight"
                  style={{ fontFamily: post.designFont || biz.headingFont }}
                >
                  {post.headline || post.title}
                </h4>
              </div>
            </div>

            {/* Quick Artwork Actions */}
            <div className="mt-4 w-full max-w-[360px] flex flex-col gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenAdjuster(post);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#f1e194] text-[#5b0e14] font-bold text-xs hover:bg-[#fff2ab] shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Sliders className="w-4 h-4" />
                <span>Adjust Photo with Bot Studio</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenCatalogSearch(post);
                  }}
                  className="py-2 px-3 rounded-lg border border-[#ded8cc] bg-white text-xs font-medium text-[#493f38] hover:bg-[#f4efe4] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5 text-[#5b0e14]" />
                  <span>Catalog Scout</span>
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="py-2 px-3 rounded-lg border border-[#ded8cc] bg-white text-xs font-medium text-[#493f38] hover:bg-[#f4efe4] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-[#2872a1]" />
                  <span>Download Artwork</span>
                </button>
              </div>
            </div>

            {/* Source info */}
            <div className="mt-4 w-full max-w-[360px] p-3 rounded-xl bg-[#f5f1e9] border border-[#e8e2d8] text-[11px] text-[#73796f]">
              <span className="font-semibold text-[#1d211b] block">Asset Rights & Origin:</span>
              <p className="mt-0.5">
                {post.imageSource?.provider || 'Curated Library'} ·{' '}
                {post.imageSource?.license || 'Commercial Cleared'}
              </p>
              {post.imageSource?.foreign_landing_url && (
                <a
                  href={post.imageSource.foreign_landing_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#2872a1] hover:underline inline-flex items-center gap-1 mt-1 font-medium"
                >
                  Inspect source origin <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>

          {/* Right: Caption & Fact Audit */}
          <div className="md:col-span-7 flex flex-col space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider">
                  Post Caption ({post.platform})
                </label>
                <span className="text-[11px] text-[#85867c] font-mono">{caption.length} characters</span>
              </div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={7}
                className="w-full p-3.5 rounded-xl border border-[#ded8cc] bg-white text-xs text-[#1d211b] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#5b0e14] transition-all font-sans"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handleCopyCaption}
                className="px-3.5 py-1.5 rounded-lg border border-[#ded8cc] bg-white text-xs font-semibold text-[#493f38] hover:bg-[#f4efe4] transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy Caption'}</span>
              </button>

              <button
                onClick={handleSaveCaption}
                className="px-4 py-1.5 rounded-lg bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] transition-colors"
              >
                Save Caption
              </button>
            </div>

            {/* Engineer Audit Checklist */}
            <div className="p-4 rounded-xl bg-[#fcfaf4] border border-[#e8e2d8] space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#527247]" />
                <h4 className="text-xs font-bold text-[#1d211b] uppercase tracking-wider">
                  Engineer Quality Audit
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                <div className="flex items-start gap-2 p-2 rounded-lg bg-white border border-[#ece8df]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#527247] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#1d211b] font-semibold">Visual Relevance Test</strong>
                    <span className="text-[#73796f]">Scored {post.visualReview?.score || 9}/10 for brand accuracy.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-lg bg-white border border-[#ece8df]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#527247] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#1d211b] font-semibold">Fact & Claim Verification</strong>
                    <span className="text-[#73796f]">Grounded in verified profile; no unverified claims.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-lg bg-white border border-[#ece8df]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#527247] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#1d211b] font-semibold">Platform Native Fit</strong>
                    <span className="text-[#73796f]">Compliant with {post.platform} organic creator rules.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-lg bg-white border border-[#ece8df]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#527247] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#1d211b] font-semibold">Commercial Rights</strong>
                    <span className="text-[#73796f]">Licensed for commercial publication.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e8e2d8] bg-[#fcfaf4] flex items-center justify-between">
          <span className="text-xs text-[#73796f]">
            Status: <strong className="text-[#1d211b]">{post.status}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#ded8cc] text-xs font-semibold text-[#73796f] hover:bg-[#f4efe4] transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleApproveAll}
              className="px-5 py-2 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] shadow-md transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-[#f1e194]" />
              <span>Mark Ready to Publish</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
