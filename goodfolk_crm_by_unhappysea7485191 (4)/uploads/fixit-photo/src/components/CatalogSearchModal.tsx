import React, { useState } from 'react';
import { Post, Business } from '../types';
import { Search, X, Check, Image as ImageIcon, ExternalLink, Loader2 } from 'lucide-react';

interface Props {
  targetPost?: Post | null;
  biz: Business;
  onClose: () => void;
  onSelectPhoto: (photo: { url: string; title: string; creator: string; license: string; provider: string }) => void;
  showToast: (msg: string) => void;
}

export const CatalogSearchModal: React.FC<Props> = ({
  targetPost,
  biz,
  onClose,
  onSelectPhoto,
  showToast,
}) => {
  const [query, setQuery] = useState(targetPost ? `${biz.industry} ${targetPost.title}` : biz.industry);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch('/api/crm/search-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: biz.id,
          query,
        }),
      });

      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      showToast('Catalog search error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#fffdf9] border border-[#e8e2d8] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-[#1d211b]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e2d8] bg-[#fcfaf4]">
          <div>
            <h2 className="text-base font-bold text-[#1d211b]">Public Photo Catalog Scout</h2>
            <p className="text-xs text-[#73796f]">
              Search royalty-free commercial photographs for {biz.name}
              {targetPost ? ` · "${targetPost.title}"` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#85867c] hover:bg-[#f2ece1] hover:text-[#1d211b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-5 border-b border-[#e8e2d8] bg-white">
          <form onSubmit={handleSearch} className="flex gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8a887b] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search photographic subjects, coffee beans, artisan ceramics, workspace..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#ded8cc] bg-[#faf8f2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14] transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-[#5b0e14] text-[#fff8ed] font-bold text-xs hover:bg-[#74131c] transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* Results Grid */}
        <div className="p-6 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#73796f]">
              <Loader2 className="w-8 h-8 animate-spin text-[#5b0e14] mb-3" />
              <p className="text-xs font-medium">Scouting Openverse & commercial photography banks...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {results.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-xl border border-[#e8e2d8] overflow-hidden bg-white shadow-sm hover:shadow-md hover:border-[#5b0e14] transition-all flex flex-col"
                >
                  <div className="aspect-[4/3] bg-[#ece7dd] relative overflow-hidden">
                    <img
                      src={item.url}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold bg-black/60 text-[#f1e194] backdrop-blur-xs">
                      {item.provider}
                    </span>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#1d211b] line-clamp-1">{item.title}</h4>
                      <p className="text-[10px] text-[#73796f] mt-0.5">by {item.creator}</p>
                      <span className="inline-block mt-1.5 text-[9px] font-semibold text-[#527247] bg-[#edf3e9] px-2 py-0.5 rounded">
                        {item.license} · Commercial Cleared
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#f0ece4] flex items-center justify-between">
                      {item.pageUrl && (
                        <a
                          href={item.pageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-[#2872a1] hover:underline flex items-center gap-1"
                        >
                          Source <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      <button
                        onClick={() => {
                          onSelectPhoto(item);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Select</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : hasSearched ? (
            <div className="text-center py-16 text-[#73796f]">
              <ImageIcon className="w-10 h-10 mx-auto text-[#ded8cc] mb-2" />
              <p className="text-xs font-semibold text-[#1d211b]">No photo matches found</p>
              <p className="text-xs text-[#85867c] mt-1">Try broader keywords like "coffee", "minimalist home", or "studio"</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
