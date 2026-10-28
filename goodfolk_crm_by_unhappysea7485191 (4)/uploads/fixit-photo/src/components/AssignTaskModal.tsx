import React, { useState } from 'react';
import { Business, BotDef, BotTask } from '../types';
import { X, CheckCircle, Bot, AlertCircle } from 'lucide-react';

interface Props {
  businesses: Business[];
  currentBizId: string;
  bots: BotDef[];
  onClose: () => void;
  onAssignTask: (task: BotTask) => void;
  showToast: (msg: string) => void;
}

export const AssignTaskModal: React.FC<Props> = ({
  businesses,
  currentBizId,
  bots,
  onClose,
  onAssignTask,
  showToast,
}) => {
  const [businessId, setBusinessId] = useState(currentBizId);
  const [botId, setBotId] = useState('editor');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !instructions.trim()) {
      showToast('Please provide a task title and instructions');
      return;
    }

    const newTask: BotTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      businessId,
      botId,
      title: title.trim(),
      instructions: instructions.trim(),
      status: 'queued',
      progress: 0,
      priority,
      engineerNote: 'Assigned to the engineer team leader for supervision.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAssignTask(newTask);
    showToast(`Task assigned to ${bots.find((b) => b.id === botId)?.name}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#fffdf9] border border-[#e8e2d8] rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-[#1d211b]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e2d8] bg-[#fcfaf4]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5b0e14] text-[#f1e194] flex items-center justify-center font-bold text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1d211b]">Assign Task to Bot Team</h2>
              <p className="text-xs text-[#73796f]">Supervised by Team Lead & Engineer.</p>
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
                Target Business
              </label>
              <select
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1">
                Assignee Bot
              </label>
              <select
                value={botId}
                onChange={(e) => setBotId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
              >
                {bots.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.job.split('·')[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Adjust coffee photos for 4:5 Instagram feed format"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1">
              Detailed Instructions *
            </label>
            <textarea
              required
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Specify the aesthetic goals, technical constraints, platform rules, and how the engineer should verify the result..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-2">
              Priority Level
            </label>
            <div className="flex gap-2">
              {(['normal', 'high', 'urgent'] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                    priority === p
                      ? 'bg-[#5b0e14] text-[#fff8ed] border-[#5b0e14]'
                      : 'bg-white text-[#73796f] border-[#ded8cc] hover:bg-[#faf6ee]'
                  }`}
                >
                  {p}
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
              Assign to Bot Team
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
