import React, { useState } from 'react';
import { Business } from '../types';
import { X, Building2, Globe, Sparkles } from 'lucide-react';

interface Props {
  onClose: () => void;
  onAddBusiness: (biz: Business) => void;
  showToast: (msg: string) => void;
}

export const AddBusinessModal: React.FC<Props> = ({ onClose, onAddBusiness, showToast }) => {
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    offer: '',
    description: '',
    audience: '',
    goal: 'Sales and orders',
    cta: '',
    tone: 'Warm, grounded, a little adventurous',
    websiteUrl: '',
    serviceArea: '',
    restrictions: '',
    visualDirection: '',
    channels: ['Instagram', 'Facebook', 'TikTok'],
  });

  const toggleChannel = (channel: string) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.industry.trim()) {
      showToast('Please provide a business name and niche');
      return;
    }

    const newBiz: Business = {
      id: `biz-${Date.now()}`,
      name: formData.name.trim(),
      industry: formData.industry.trim(),
      initial: formData.name.trim().charAt(0).toUpperCase(),
      theme: 'burgundy',
      headingFont: 'DM Serif Display',
      bodyFont: 'DM Sans',
      tone: formData.tone,
      audience: formData.audience,
      channels: formData.channels,
      description: `${formData.description} Products/Services: ${formData.offer}`,
      websiteUrl: formData.websiteUrl,
      websiteInsights: {
        title: formData.name,
        description: formData.description,
        colors: ['#5B0E14', '#F1E194', '#2C1810'],
        fonts: ['DM Serif Display', 'DM Sans'],
        fetchedAt: new Date().toISOString(),
      },
      businessProfile: {
        offer: formData.offer,
        differentiator: formData.description,
        audience: formData.audience,
        goal: formData.goal,
        callToAction: formData.cta,
        brandVoice: formData.tone,
        serviceArea: formData.serviceArea,
        restrictions: formData.restrictions,
        visualDirection: formData.visualDirection,
        channels: formData.channels,
      },
      createdAt: new Date().toISOString(),
    };

    onAddBusiness(newBiz);
    showToast(`Workspace and workflow created for ${newBiz.name}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#fffdf9] border border-[#e8e2d8] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-[#1d211b]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e2d8] bg-[#fcfaf4]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5b0e14] text-[#f1e194] flex items-center justify-center font-bold text-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1d211b]">Add Business Subaccount</h2>
              <p className="text-xs text-[#73796f]">Creates a brand workspace, visual library, and bot workflow.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#85867c] hover:bg-[#f2ece1] hover:text-[#1d211b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1">
                Business Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Hearth & Pine Bakery"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1">
                Industry / Niche *
              </label>
              <input
                type="text"
                required
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g. Artisanal Bakery & Cafe"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1">
              Products or Services *
            </label>
            <textarea
              required
              rows={2}
              value={formData.offer}
              onChange={(e) => setFormData({ ...formData, offer: e.target.value })}
              placeholder="What does the business sell or provide? e.g. Sourdough bread, morning pastries, seasonal tarts"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1">
              What Makes It Different? *
            </label>
            <textarea
              required
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Unique methods, heritage, small batches, local ingredients..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1">
                Target Audience
              </label>
              <input
                type="text"
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                placeholder="e.g. Neighborhood regulars, food enthusiasts"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1">
                Brand Voice & Tone
              </label>
              <input
                type="text"
                value={formData.tone}
                onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                placeholder="e.g. Warm, inviting, honest"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1">
                Call to Action
              </label>
              <input
                type="text"
                value={formData.cta}
                onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                placeholder="e.g. Order ahead for pickup"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1">
                Website URL (optional)
              </label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1">
              Visual Direction for Photography
            </label>
            <input
              type="text"
              value={formData.visualDirection}
              onChange={(e) => setFormData({ ...formData, visualDirection: e.target.value })}
              placeholder="e.g. Golden morning light, flour dust in air, rustic wooden boards, crisp crust textures"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-2">
              Active Marketing Channels
            </label>
            <div className="flex flex-wrap gap-2">
              {['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'Pinterest'].map((channel) => (
                <button
                  type="button"
                  key={channel}
                  onClick={() => toggleChannel(channel)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    formData.channels.includes(channel)
                      ? 'bg-[#5b0e14] text-[#fff8ed] border-[#5b0e14]'
                      : 'bg-white text-[#73796f] border-[#ded8cc] hover:bg-[#faf6ee]'
                  }`}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#e8e2d8] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#ded8cc] text-xs font-semibold text-[#73796f] hover:bg-[#f4efe4] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] shadow-md transition-colors"
            >
              Create Business Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
