import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState } from "react";
import { classifyEgyptianNiche } from "../../data/egyptian-niches.js";
import { Search, X, Check, Image as ImageIcon, ExternalLink, Loader2 } from "lucide-react";
const CatalogSearchModal = ({
  targetPost,
  biz,
  onClose,
  onSelectPhoto,
  showToast
}) => {
  const [query, setQuery] = useState(targetPost ? `${biz.industry} ${targetPost.title}` : biz.industry);
  const [results, setResults] = useState([]);
  const [classification, setClassification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    const matchedNiche = classifyEgyptianNiche({ query, business: biz });
    setClassification(matchedNiche);
    try {
      const res = await fetch("/api/crm/search-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: biz.id,
          query,
          classification: matchedNiche
        })
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.results || []);
      setClassification(data.classification || null);
    } catch (err) {
      showToast("Catalog search error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  React.useEffect(() => {
    handleSearch();
  }, []);
  return /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-[#fffdf9] border border-[#e8e2d8] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-[#1d211b]", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between px-6 py-4 border-b border-[#e8e2d8] bg-[#fcfaf4]", children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("h2", { className: "text-base font-bold text-[#1d211b]", children: "Public Photo Catalog Scout" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 68,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f]", children: [
          "Search royalty-free commercial photographs for ",
          biz.name,
          targetPost ? ` \xB7 "${targetPost.title}"` : ""
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 69,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 67,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: onClose,
          className: "p-1.5 rounded-lg text-[#85867c] hover:bg-[#f2ece1] hover:text-[#1d211b] transition-colors",
          children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 78,
            columnNumber: 13
          })
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 74,
          columnNumber: 11
        }
      )
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 66,
      columnNumber: 9
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "p-5 border-b border-[#e8e2d8] bg-white", children: [
      /* @__PURE__ */ jsxDEV("form", { onSubmit: handleSearch, className: "flex gap-2.5", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "relative flex-1", children: [
          /* @__PURE__ */ jsxDEV(Search, { className: "w-4 h-4 text-[#8a887b] absolute left-3.5 top-1/2 -translate-y-1/2" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 86,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "text",
              value: query,
              onChange: (e) => setQuery(e.target.value),
              placeholder: "Search photographic subjects, coffee beans, artisan ceramics, workspace...",
              className: "w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#ded8cc] bg-[#faf8f2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14] transition-all"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 87,
              columnNumber: 15
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 85,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "submit",
            disabled: isLoading,
            className: "px-5 py-2.5 rounded-xl bg-[#5b0e14] text-[#fff8ed] font-bold text-xs hover:bg-[#74131c] transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50",
            children: [
              isLoading ? /* @__PURE__ */ jsxDEV(Loader2, { className: "w-4 h-4 animate-spin" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 100,
                columnNumber: 28
              }) : /* @__PURE__ */ jsxDEV(Search, { className: "w-4 h-4" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 100,
                columnNumber: 75
              }),
              /* @__PURE__ */ jsxDEV("span", { children: "Search" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 101,
                columnNumber: 15
              })
            ]
          },
          void 0,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 95,
            columnNumber: 13
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 84,
        columnNumber: 11
      }),
      classification && /* @__PURE__ */ jsxDEV("div", { className: "mt-3 flex flex-wrap items-center gap-2 text-[10px]", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "rounded-full bg-[#f3e9e4] px-2.5 py-1 font-bold text-[#5b0e14]", children: [
          classification.category,
          " \xB7 ",
          classification.subNiche
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 106,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV("span", { className: "text-[#73796f]", children: classification.photographyStyle }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 109,
          columnNumber: 15
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 105,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 83,
      columnNumber: 9
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "p-6 flex-1 overflow-y-auto", children: isLoading ? /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col items-center justify-center py-16 text-[#73796f]", children: [
      /* @__PURE__ */ jsxDEV(Loader2, { className: "w-8 h-8 animate-spin text-[#5b0e14] mb-3" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 118,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("p", { className: "text-xs font-medium", children: "Scouting Openverse & commercial photography banks..." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 119,
        columnNumber: 15
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 117,
      columnNumber: 13
    }) : results.length > 0 ? /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4", children: results.map((item) => /* @__PURE__ */ jsxDEV(
      "div",
      {
        className: "group relative rounded-xl border border-[#e8e2d8] overflow-hidden bg-white shadow-sm hover:shadow-md hover:border-[#5b0e14] transition-all flex flex-col",
        children: [
          /* @__PURE__ */ jsxDEV("div", { className: "aspect-[4/3] bg-[#ece7dd] relative overflow-hidden", children: [
            /* @__PURE__ */ jsxDEV(
              "img",
              {
                src: item.url,
                alt: item.title,
                referrerPolicy: "no-referrer",
                className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 129,
                columnNumber: 21
              }
            ),
            /* @__PURE__ */ jsxDEV("span", { className: "absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold bg-black/60 text-[#f1e194] backdrop-blur-xs", children: item.provider }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 135,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 128,
            columnNumber: 19
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "p-3 flex-1 flex flex-col justify-between", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("h4", { className: "text-xs font-bold text-[#1d211b] line-clamp-1", children: item.title }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 142,
                columnNumber: 23
              }),
              /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-[#73796f] mt-0.5", children: [
                "by ",
                item.creator
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 143,
                columnNumber: 23
              }),
              /* @__PURE__ */ jsxDEV("span", { className: "inline-block mt-1.5 text-[9px] font-semibold text-[#527247] bg-[#edf3e9] px-2 py-0.5 rounded", children: [
                item.license,
                " \xB7 Commercial Cleared"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 144,
                columnNumber: 23
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 141,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "mt-3 pt-2 border-t border-[#f0ece4] flex items-center justify-between", children: [
              item.pageUrl && /* @__PURE__ */ jsxDEV(
                "a",
                {
                  href: item.pageUrl,
                  target: "_blank",
                  rel: "noreferrer",
                  className: "text-[10px] text-[#2872a1] hover:underline flex items-center gap-1",
                  children: [
                    "Source ",
                    /* @__PURE__ */ jsxDEV(ExternalLink, { className: "w-2.5 h-2.5" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 157,
                      columnNumber: 34
                    })
                  ]
                },
                void 0,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 151,
                  columnNumber: 25
                }
              ),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: async () => {
                    try {
                      const response = await fetch("/api/crm/reserve-photo", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: item.url, sourceId: item.id, title: item.title })
                      });
                      const result = await response.json();
                      if (!response.ok) {
                        showToast(result.error || "Choose a photo that has not been used yet.");
                        return;
                      }
                      onSelectPhoto(item);
                      onClose();
                    } catch {
                      showToast("Could not reserve this photo. Please try again.");
                    }
                  },
                  className: "px-3 py-1.5 rounded-lg bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] transition-colors flex items-center gap-1",
                  children: [
                    /* @__PURE__ */ jsxDEV(Check, { className: "w-3.5 h-3.5" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 181,
                      columnNumber: 25
                    }),
                    /* @__PURE__ */ jsxDEV("span", { children: "Select" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 182,
                      columnNumber: 25
                    })
                  ]
                },
                void 0,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 160,
                  columnNumber: 23
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 149,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 140,
            columnNumber: 19
          })
        ]
      },
      item.id,
      true,
      {
        fileName: "<stdin>",
        lineNumber: 124,
        columnNumber: 17
      }
    )) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 122,
      columnNumber: 13
    }) : hasSearched ? /* @__PURE__ */ jsxDEV("div", { className: "text-center py-16 text-[#73796f]", children: [
      /* @__PURE__ */ jsxDEV(ImageIcon, { className: "w-10 h-10 mx-auto text-[#ded8cc] mb-2" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 191,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("p", { className: "text-xs font-semibold text-[#1d211b]", children: "No photo matches found" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 192,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#85867c] mt-1", children: 'Try broader keywords like "coffee", "minimalist home", or "studio"' }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 193,
        columnNumber: 15
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 190,
      columnNumber: 13
    }) : null }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 115,
      columnNumber: 9
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 64,
    columnNumber: 7
  }) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 63,
    columnNumber: 5
  });
};
export {
  CatalogSearchModal
};
