import { jsxDEV } from "react/jsx-dev-runtime";
import { useState } from "react";
import { composeAndDownloadArtwork } from "../utils/canvasExporter.ts";
import { photoEnglishText } from "../utils/photoText.js";
import {
  X,
  Sliders,
  Check,
  Copy,
  Download,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Search
} from "lucide-react";
const PostReviewModal = ({
  post,
  biz,
  onClose,
  onUpdatePost,
  onOpenAdjuster,
  onOpenCatalogSearch,
  showToast
}) => {
  const [caption, setCaption] = useState(post.caption);
  const [videoPrompts, setVideoPrompts] = useState(post.videoPrompts || { script: "", visuals: "", avatar: "", render: "" });
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setIsCopied(true);
      showToast("Caption copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2e3);
    } catch {
      showToast("Could not copy automatically");
    }
  };
  const handleSaveCaption = () => {
    const updated = {
      ...post,
      caption,
      ...post.videoPrompts ? { videoPrompts } : {},
      contentApproved: true,
      status: "Ready for review"
    };
    onUpdatePost(updated);
    showToast("Caption saved & approved!");
  };
  const handleApproveAll = () => {
    const updated = {
      ...post,
      caption,
      ...post.videoPrompts ? { videoPrompts } : {},
      imageApproved: true,
      contentApproved: true,
      ...post.videoUrl ? { videoApproved: true } : {},
      status: "Ready for review"
    };
    onUpdatePost(updated);
    showToast("Post marked ready for publication!");
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
          aspectRatio: "1:1",
          movement: "editorial",
          overlayStyle: "classic"
        }
      );
      showToast("Artwork downloaded!");
    } catch (e) {
      showToast("Download failed: " + e.message);
    } finally {
      setIsDownloading(false);
    }
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-[#fffdf9] border border-[#e8e2d8] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-[#1d211b]", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between px-6 py-4 border-b border-[#e8e2d8] bg-[#fcfaf4]", children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#5b0e14] text-[#f1e194]", children: post.platform }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 114,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("h2", { className: "text-base font-bold text-[#1d211b]", children: post.title }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 117,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 113,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f] mt-0.5", children: [
          biz.name,
          " \xB7 ",
          post.time,
          " \xB7 ",
          post.tone || "Brand voice"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 119,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 112,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: onClose,
          className: "p-1.5 rounded-lg text-[#85867c] hover:bg-[#f2ece1] hover:text-[#1d211b] transition-colors",
          children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 128,
            columnNumber: 13
          })
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 124,
          columnNumber: 11
        }
      )
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 111,
      columnNumber: 9
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto p-6 gap-6", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "md:col-span-5 flex flex-col items-center", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "w-full max-w-[360px] aspect-square rounded-xl overflow-hidden shadow-lg border border-[#e8e2d8] relative bg-[#211a19] group", children: [
          post.videoUrl ? /* @__PURE__ */ jsxDEV("video", { src: post.videoUrl, controls: true, playsInline: true, className: "w-full h-full object-contain bg-black" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 137,
            columnNumber: 32
          }) : post.imageUrl ? /* @__PURE__ */ jsxDEV("img", { src: post.imageUrl, alt: post.title, referrerPolicy: "no-referrer", className: "w-full h-full object-cover" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 137,
            columnNumber: 151
          }) : /* @__PURE__ */ jsxDEV("div", { className: "w-full h-full flex items-center justify-center bg-gradient-to-br from-[#332b29] to-[#5b0e14] text-center text-xs font-semibold text-white/80 p-6", children: [
            "Video rendering is in progress for ",
            biz.name
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 137,
            columnNumber: 266
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold", style: { color: post.subColor || "#f1e194", fontFamily: post.subFont || biz.bodyFont }, children: photoEnglishText(post.sub || biz.name) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 139,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV(
              "h4",
              {
                className: "text-lg font-bold leading-tight",
                style: { fontFamily: post.designFont || biz.headingFont, color: post.headlineColor || "#ffffff" },
                children: photoEnglishText(post.headline || post.title)
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 140,
                columnNumber: 17
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 138,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 136,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "mt-4 w-full max-w-[360px] flex flex-col gap-2", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => {
                onClose();
                onOpenAdjuster(post);
              },
              className: "w-full py-2.5 px-4 rounded-xl bg-[#f1e194] text-[#5b0e14] font-bold text-xs hover:bg-[#fff2ab] shadow-sm transition-colors flex items-center justify-center gap-2",
              children: [
                /* @__PURE__ */ jsxDEV(Sliders, { className: "w-4 h-4" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 158,
                  columnNumber: 17
                }),
                /* @__PURE__ */ jsxDEV("span", { children: "Adjust Photo with Bot Studio" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 159,
                  columnNumber: 17
                })
              ]
            },
            void 0,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 151,
              columnNumber: 15
            }
          ),
          /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 gap-2", children: [
            post.videoUrl && /* @__PURE__ */ jsxDEV("a", { href: post.videoUrl, target: "_blank", rel: "noreferrer", download: true, className: "col-span-2 py-2 px-3 rounded-lg border border-[#ded8cc] bg-white text-xs font-medium text-[#493f38] hover:bg-[#f4efe4] text-center", children: "Download MP4" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 163,
              columnNumber: 35
            }),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => {
                  onClose();
                  onOpenCatalogSearch(post);
                },
                className: "py-2 px-3 rounded-lg border border-[#ded8cc] bg-white text-xs font-medium text-[#493f38] hover:bg-[#f4efe4] transition-colors flex items-center justify-center gap-1.5",
                children: [
                  /* @__PURE__ */ jsxDEV(Search, { className: "w-3.5 h-3.5 text-[#5b0e14]" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 171,
                    columnNumber: 19
                  }),
                  /* @__PURE__ */ jsxDEV("span", { children: "Catalog Scout" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 172,
                    columnNumber: 19
                  })
                ]
              },
              void 0,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 164,
                columnNumber: 17
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: handleDownload,
                disabled: isDownloading,
                className: "py-2 px-3 rounded-lg border border-[#ded8cc] bg-white text-xs font-medium text-[#493f38] hover:bg-[#f4efe4] transition-colors flex items-center justify-center gap-1.5",
                children: [
                  /* @__PURE__ */ jsxDEV(Download, { className: "w-3.5 h-3.5 text-[#2872a1]" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 179,
                    columnNumber: 19
                  }),
                  /* @__PURE__ */ jsxDEV("span", { children: "Download Artwork" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 180,
                    columnNumber: 19
                  })
                ]
              },
              void 0,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 174,
                columnNumber: 17
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 162,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 150,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "mt-4 w-full max-w-[360px] p-3 rounded-xl bg-[#f5f1e9] border border-[#e8e2d8] text-[11px] text-[#73796f]", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "font-semibold text-[#1d211b] block", children: "Asset Rights & Origin:" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 187,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("p", { className: "mt-0.5", children: [
            post.imageSource?.provider || "Curated Library",
            " \xB7",
            " ",
            post.imageSource?.license || "Commercial Cleared"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 188,
            columnNumber: 15
          }),
          post.imageSource?.foreign_landing_url && /* @__PURE__ */ jsxDEV(
            "a",
            {
              href: post.imageSource.foreign_landing_url,
              target: "_blank",
              rel: "noreferrer",
              className: "text-[#2872a1] hover:underline inline-flex items-center gap-1 mt-1 font-medium",
              children: [
                "Inspect source origin ",
                /* @__PURE__ */ jsxDEV(ExternalLink, { className: "w-2.5 h-2.5" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 199,
                  columnNumber: 41
                })
              ]
            },
            void 0,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 193,
              columnNumber: 17
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 186,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 135,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "md:col-span-7 flex flex-col space-y-4", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between mb-1.5", children: [
            /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider", children: [
              "Post Caption (",
              post.platform,
              ")"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 209,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("span", { className: "text-[11px] text-[#85867c] font-mono", children: [
              caption.length,
              " characters"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 212,
              columnNumber: 17
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 208,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV(
            "textarea",
            {
              value: caption,
              onChange: (e) => setCaption(e.target.value),
              rows: 7,
              className: "w-full p-3.5 rounded-xl border border-[#ded8cc] bg-white text-xs text-[#1d211b] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#5b0e14] transition-all font-sans"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 214,
              columnNumber: 15
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 207,
          columnNumber: 13
        }),
        post.videoPrompts && /* @__PURE__ */ jsxDEV("details", { className: "rounded-xl border border-[#e8e2d8] bg-[#fcfaf4] p-3", children: [
          /* @__PURE__ */ jsxDEV("summary", { className: "cursor-pointer text-xs font-bold text-[#5b0e14]", children: "Edit video production prompts" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 224,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "mt-3 space-y-3", children: [
            ["script", "visuals", "avatar", "render"].map((key) => /* @__PURE__ */ jsxDEV("label", { className: "block text-[10px] font-bold uppercase tracking-wide text-[#73796f]", children: [
              key === "render" ? "Timeline / render config" : `${key} prompt`,
              /* @__PURE__ */ jsxDEV("textarea", { value: videoPrompts[key], onChange: (e) => setVideoPrompts((current) => ({ ...current, [key]: e.target.value })), rows: key === "script" ? 6 : 4, className: "mt-1 w-full rounded-lg border border-[#ded8cc] bg-white p-2.5 text-[11px] font-mono leading-relaxed text-[#1d211b]" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 229,
                columnNumber: 23
              })
            ] }, key, true, {
              fileName: "<stdin>",
              lineNumber: 227,
              columnNumber: 21
            })),
            /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-[#73796f]", children: "Save Caption stores these prompt edits with the CRM post and Swarm batch." }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 232,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 225,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 223,
          columnNumber: 15
        }),
        !!post.researchSources?.length && /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl border border-[#e8e2d8] bg-[#fcfaf4] p-3", children: [
          /* @__PURE__ */ jsxDEV("strong", { className: "block text-[10px] uppercase tracking-wider text-[#73796f] mb-2", children: "Public research references" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 239,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-1.5", children: post.researchSources.map((source, index) => /* @__PURE__ */ jsxDEV("a", { href: source.url, target: "_blank", rel: "noreferrer", className: "flex items-center justify-between gap-2 text-[11px] text-[#2872a1] hover:underline", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxDEV("small", { className: "block text-[9px] uppercase tracking-wide text-[#85867c]", children: [source.platform, source.kind === "ad-example" ? "public ad example" : source.kind === "social-post" ? "public social post" : "web reference"].filter(Boolean).join(" \xB7 ") }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 243,
                columnNumber: 49
              }),
              /* @__PURE__ */ jsxDEV("span", { className: "block truncate", children: source.title || source.url }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 243,
                columnNumber: 304
              }),
              source.snippet && /* @__PURE__ */ jsxDEV("small", { className: "block truncate text-[#73796f]", children: source.snippet }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 243,
                columnNumber: 391
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 243,
              columnNumber: 23
            }),
            /* @__PURE__ */ jsxDEV(ExternalLink, { className: "w-3 h-3 shrink-0" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 243,
              columnNumber: 472
            })
          ] }, `${source.url}-${index}`, true, {
            fileName: "<stdin>",
            lineNumber: 242,
            columnNumber: 21
          })) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 240,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 238,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: handleCopyCaption,
              className: "px-3.5 py-1.5 rounded-lg border border-[#ded8cc] bg-white text-xs font-semibold text-[#493f38] hover:bg-[#f4efe4] transition-colors flex items-center gap-1.5 shadow-xs",
              children: [
                isCopied ? /* @__PURE__ */ jsxDEV(Check, { className: "w-3.5 h-3.5 text-green-600" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 255,
                  columnNumber: 29
                }) : /* @__PURE__ */ jsxDEV(Copy, { className: "w-3.5 h-3.5" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 255,
                  columnNumber: 80
                }),
                /* @__PURE__ */ jsxDEV("span", { children: isCopied ? "Copied" : "Copy Caption" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 256,
                  columnNumber: 17
                })
              ]
            },
            void 0,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 251,
              columnNumber: 15
            }
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: handleSaveCaption,
              className: "px-4 py-1.5 rounded-lg bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] transition-colors",
              children: "Save Caption"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 259,
              columnNumber: 15
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 250,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "p-4 rounded-xl bg-[#fcfaf4] border border-[#e8e2d8] space-y-3", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxDEV(ShieldCheck, { className: "w-4 h-4 text-[#527247]" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 270,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("h4", { className: "text-xs font-bold text-[#1d211b] uppercase tracking-wider", children: "Engineer Quality Audit" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 271,
              columnNumber: 17
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 269,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-start gap-2 p-2 rounded-lg bg-white border border-[#ece8df]", children: [
              /* @__PURE__ */ jsxDEV(CheckCircle2, { className: "w-3.5 h-3.5 text-[#527247] shrink-0 mt-0.5" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 278,
                columnNumber: 19
              }),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("strong", { className: "block text-[#1d211b] font-semibold", children: "Visual Relevance Test" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 280,
                  columnNumber: 21
                }),
                /* @__PURE__ */ jsxDEV("span", { className: "text-[#73796f]", children: post.visualReview?.score ? `Scored ${post.visualReview.score}/10.` : "Selected against the post brief; owner review is pending." }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 281,
                  columnNumber: 21
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 279,
                columnNumber: 19
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 277,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-start gap-2 p-2 rounded-lg bg-white border border-[#ece8df]", children: [
              /* @__PURE__ */ jsxDEV(CheckCircle2, { className: "w-3.5 h-3.5 text-[#527247] shrink-0 mt-0.5" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 286,
                columnNumber: 19
              }),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("strong", { className: "block text-[#1d211b] font-semibold", children: "Fact & Claim Verification" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 288,
                  columnNumber: 21
                }),
                /* @__PURE__ */ jsxDEV("span", { className: "text-[#73796f]", children: "Uses supplied business details and restrictions; review claims before approval." }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 289,
                  columnNumber: 21
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 287,
                columnNumber: 19
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 285,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-start gap-2 p-2 rounded-lg bg-white border border-[#ece8df]", children: [
              /* @__PURE__ */ jsxDEV(CheckCircle2, { className: "w-3.5 h-3.5 text-[#527247] shrink-0 mt-0.5" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 294,
                columnNumber: 19
              }),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("strong", { className: "block text-[#1d211b] font-semibold", children: "Platform Native Fit" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 296,
                  columnNumber: 21
                }),
                /* @__PURE__ */ jsxDEV("span", { className: "text-[#73796f]", children: [
                  "Prepared for ",
                  post.platform,
                  "; confirm current platform specs before publishing."
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 297,
                  columnNumber: 21
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 295,
                columnNumber: 19
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 293,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-start gap-2 p-2 rounded-lg bg-white border border-[#ece8df]", children: [
              /* @__PURE__ */ jsxDEV(CheckCircle2, { className: "w-3.5 h-3.5 text-[#527247] shrink-0 mt-0.5" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 302,
                columnNumber: 19
              }),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("strong", { className: "block text-[#1d211b] font-semibold", children: "Commercial Rights" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 304,
                  columnNumber: 21
                }),
                /* @__PURE__ */ jsxDEV("span", { className: "text-[#73796f]", children: post.imageSource?.license === "AI-generated" ? "Original AI-generated image; review before publishing." : post.imageSource?.license ? `Source license: ${post.imageSource.license}. Confirm its terms before use.` : "Check the source license before commercial use." }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 305,
                  columnNumber: 21
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 303,
                columnNumber: 19
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 301,
              columnNumber: 17
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 276,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 268,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 206,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 133,
      columnNumber: 9
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "p-4 border-t border-[#e8e2d8] bg-[#fcfaf4] flex items-center justify-between", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "text-xs text-[#73796f]", children: [
        "Status: ",
        /* @__PURE__ */ jsxDEV("strong", { className: "text-[#1d211b]", children: post.status }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 316,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 315,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: onClose,
            className: "px-4 py-2 rounded-xl border border-[#ded8cc] text-xs font-semibold text-[#73796f] hover:bg-[#f4efe4] transition-colors",
            children: "Close"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 320,
            columnNumber: 13
          }
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: handleApproveAll,
            className: "px-5 py-2 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] shadow-md transition-colors flex items-center gap-1.5",
            children: [
              /* @__PURE__ */ jsxDEV(Check, { className: "w-4 h-4 text-[#f1e194]" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 330,
                columnNumber: 15
              }),
              /* @__PURE__ */ jsxDEV("span", { children: "Mark Ready to Publish" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 331,
                columnNumber: 15
              })
            ]
          },
          void 0,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 326,
            columnNumber: 13
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 319,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 314,
      columnNumber: 9
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 109,
    columnNumber: 7
  }) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 108,
    columnNumber: 5
  });
};
export {
  PostReviewModal
};
