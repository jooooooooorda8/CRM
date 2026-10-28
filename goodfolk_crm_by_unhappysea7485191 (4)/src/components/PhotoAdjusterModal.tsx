import { jsxDEV } from "react/jsx-dev-runtime";
import { useState } from "react";
import { composeAndDownloadArtwork } from "../utils/canvasExporter.ts";
import { photoEnglishText } from "../utils/photoText.js";
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
  Wand2
} from "lucide-react";
const fontOptions = [
  "DM Serif Display",
  "Cormorant Garamond",
  "Space Grotesk",
  "Playfair Display",
  "Libre Baskerville",
  "Outfit",
  "Bitter",
  "Lora",
  "Raleway",
  "Oswald",
  "Nunito Sans",
  "Urbanist",
  "Merriweather",
  "Crimson Text",
  "Montserrat",
  "Lato",
  "Poppins",
  "Rubik",
  "Josefin Sans",
  "Bodoni Moda",
  "Sora",
  "Archivo",
  "Fraunces",
  "Barlow Condensed"
];
const PhotoAdjusterModal = ({
  post,
  biz,
  onClose,
  onUpdatePost,
  onOpenCatalogSearch,
  onRegeneratePhoto,
  showToast
}) => {
  const initialAdjustments = post.adjustments || {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    warmth: 0,
    vignette: 10,
    aspectRatio: "1:1",
    movement: "editorial",
    overlayStyle: "classic"
  };
  const [adjustments, setAdjustments] = useState(initialAdjustments);
  const [headline, setHeadline] = useState(photoEnglishText(post.headline || post.title || biz.name));
  const [subtitle, setSubtitle] = useState(photoEnglishText(post.sub || biz.name));
  const [selectedFont, setSelectedFont] = useState(post.designFont || biz.headingFont || "DM Serif Display");
  const [selectedSubFont, setSelectedSubFont] = useState(post.subFont || biz.bodyFont || "DM Sans");
  const [headlineColor, setHeadlineColor] = useState(post.headlineColor || "#FFFFFF");
  const [subtitleColor, setSubtitleColor] = useState(post.subColor || post.designPalette?.[1] || "#F1E194");
  const [botPrompt, setBotPrompt] = useState("");
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [botMessage, setBotMessage] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("bot");
  const filterString = [
    `brightness(${adjustments.brightness}%)`,
    `contrast(${adjustments.contrast}%)`,
    `saturate(${adjustments.saturation}%)`,
    adjustments.warmth > 0 ? `sepia(${Math.min(adjustments.warmth * 1.5, 45)}%)` : "",
    adjustments.warmth < 0 ? `hue-rotate(${adjustments.warmth * 0.5}deg)` : ""
  ].filter(Boolean).join(" ");
  const aspectClass = {
    "1:1": "aspect-square max-w-[460px]",
    "4:5": "aspect-[4/5] max-w-[380px]",
    "9:16": "aspect-[9/16] max-w-[300px]",
    "16:9": "aspect-[16/9] max-w-[520px]"
  }[adjustments.aspectRatio];
  const primaryColor = post.designPalette?.[0] || biz.websiteInsights?.colors?.[0] || "#5B0E14";
  const accentColor = post.designPalette?.[1] || biz.websiteInsights?.colors?.[1] || "#F1E194";
  const handleBotAdjust = async (instructionText) => {
    const promptToSend = instructionText || botPrompt;
    if (!promptToSend.trim()) return;
    setIsBotThinking(true);
    setBotMessage(null);
    try {
      const res = await fetch("/api/crm/adjust-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          adjustments,
          botInstruction: promptToSend
        })
      });
      if (!res.ok) throw new Error("Bot adjustment failed");
      const data = await res.json();
      if (data.adjustments) {
        setAdjustments(data.adjustments);
      }
      if (data.post?.designFont) {
        setSelectedFont(data.post.designFont);
      }
      setBotMessage(data.feedback || "Adjustments calculated by Visual Editor bot.");
      showToast("Visual Editor bot applied adjustments!");
    } catch (e) {
      showToast("Visual Editor adjustment error: " + (e.message || "Unknown"));
    } finally {
      setIsBotThinking(false);
      setBotPrompt("");
    }
  };
  const handleApplyPreset = (preset) => {
    switch (preset) {
      case "golden":
        setAdjustments((prev) => ({
          ...prev,
          brightness: 104,
          contrast: 105,
          saturation: 110,
          warmth: 18,
          vignette: 15
        }));
        showToast("Preset: Warm Golden Hour");
        break;
      case "moody":
        setAdjustments((prev) => ({
          ...prev,
          brightness: 92,
          contrast: 125,
          saturation: 90,
          warmth: -5,
          vignette: 35
        }));
        showToast("Preset: Moody Noir");
        break;
      case "vibrant":
        setAdjustments((prev) => ({
          ...prev,
          brightness: 102,
          contrast: 115,
          saturation: 135,
          warmth: 5,
          vignette: 10
        }));
        showToast("Preset: Vibrant Editorial");
        break;
      case "clean":
        setAdjustments((prev) => ({
          ...prev,
          brightness: 102,
          contrast: 100,
          saturation: 98,
          warmth: 0,
          vignette: 5
        }));
        showToast("Preset: Clean & Crisp");
        break;
      case "vintage":
        setAdjustments((prev) => ({
          ...prev,
          brightness: 98,
          contrast: 110,
          saturation: 85,
          warmth: 24,
          vignette: 25
        }));
        showToast("Preset: Vintage Film");
        break;
      default:
        setAdjustments(initialAdjustments);
        showToast("Preset: Reset to Original");
    }
  };
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await composeAndDownloadArtwork(
        { ...post, designFont: selectedFont, subFont: selectedSubFont, headline, sub: subtitle, headlineColor, subColor: subtitleColor },
        biz,
        adjustments,
        headline
      );
      showToast("Finished artwork downloaded successfully!");
    } catch (err) {
      showToast("Download error: " + (err.message || "Failed"));
    } finally {
      setIsDownloading(false);
    }
  };
  const handleRegenerate = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    try {
      await onRegeneratePhoto(post);
    } catch (error) {
      showToast("Image regeneration error: " + (error?.message || "Please retry."));
    } finally {
      setIsRegenerating(false);
    }
  };
  const handleSaveAndApprove = () => {
    const updated = {
      ...post,
      headline,
      sub: subtitle,
      designFont: selectedFont,
      subFont: selectedSubFont,
      headlineColor,
      subColor: subtitleColor,
      adjustments,
      imageApproved: true,
      visualReview: {
        approved: true,
        score: 10,
        notes: `Adjusted and approved by owner with Visual Editor bot (${adjustments.aspectRatio}, ${adjustments.movement}).`,
        revisionDirection: "Optimal composition saved for production."
      }
    };
    onUpdatePost(updated);
    showToast("Photo adjustments saved & approved!");
    onClose();
  };
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      showToast("Uploading custom replacement photo...");
      const res = await fetch(`/api/crm/post-image`, {
        method: "POST",
        headers: {
          "x-content-id": post.id,
          "x-filename": file.name,
          "content-type": file.type
        },
        body: file
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const updated = {
        ...post,
        imageUrl: data.url,
        imageApproved: true
      };
      onUpdatePost(updated);
      showToast("Replacement photo uploaded & attached!");
    } catch (err) {
      showToast("Upload error: " + err.message);
    }
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-[#fffdf9] border border-[#e8e2d8] rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden text-[#1d211b]", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between px-6 py-4 border-b border-[#e8e2d8] bg-[#fcfaf4]", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "w-9 h-9 rounded-xl bg-[#5b0e14] text-[#f1e194] flex items-center justify-center font-bold text-xs shadow-sm", children: "VE" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 303,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxDEV("h2", { className: "text-base font-bold tracking-tight text-[#1d211b]", children: "Visual Editor Studio" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 308,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("span", { className: "px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#eef4e9] text-[#527247] border border-[#d6e3ce]", children: "Interactive Bot Adjuster" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 309,
              columnNumber: 17
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 307,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f]", children: [
            biz.name,
            " \xB7 ",
            post.platform,
            " \xB7 ",
            post.title
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 313,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 306,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 302,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => onOpenCatalogSearch(post),
            className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#ded8cc] bg-white text-xs font-medium text-[#493f38] hover:bg-[#f4efe4] transition-colors",
            children: [
              /* @__PURE__ */ jsxDEV(Search, { className: "w-3.5 h-3.5 text-[#5b0e14]" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 324,
                columnNumber: 15
              }),
              /* @__PURE__ */ jsxDEV("span", { children: "Search Catalogs" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 325,
                columnNumber: 15
              })
            ]
          },
          void 0,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 320,
            columnNumber: 13
          }
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: handleRegenerate,
            disabled: isRegenerating,
            className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#ded8cc] bg-white text-xs font-medium text-[#493f38] hover:bg-[#f4efe4] transition-colors",
            children: [
              /* @__PURE__ */ jsxDEV(RefreshCw, { className: "w-3.5 h-3.5 text-[#2872a1]" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 333,
                columnNumber: 15
              }),
              /* @__PURE__ */ jsxDEV("span", { children: isRegenerating ? "Generating fresh photo\u2026" : "Regenerate Image" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 334,
                columnNumber: 15
              })
            ]
          },
          void 0,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 328,
            columnNumber: 13
          }
        ),
        /* @__PURE__ */ jsxDEV("label", { className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#ded8cc] bg-white text-xs font-medium text-[#493f38] hover:bg-[#f4efe4] cursor-pointer transition-colors", children: [
          /* @__PURE__ */ jsxDEV(Upload, { className: "w-3.5 h-3.5 text-[#fd802e]" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 338,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("span", { children: "Upload Custom" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 339,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("input", { type: "file", accept: "image/*", onChange: handleFileUpload, className: "hidden" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 340,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 337,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: onClose,
            className: "p-1.5 rounded-lg text-[#85867c] hover:bg-[#f2ece1] hover:text-[#1d211b] transition-colors ml-2",
            "aria-label": "Close modal",
            children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 348,
              columnNumber: 15
            })
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 343,
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
      lineNumber: 301,
      columnNumber: 9
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden min-h-0", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "lg:col-span-7 bg-[#211a19] p-6 flex flex-col items-center justify-center relative overflow-auto border-r border-[#3a2c2c]/40", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "absolute top-4 left-6 flex items-center gap-2 z-20", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "px-2.5 py-1 rounded-md text-[11px] font-semibold bg-black/60 backdrop-blur-md text-[#f1e194] border border-white/10", children: [
            adjustments.aspectRatio,
            " Aspect"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 359,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("span", { className: "px-2.5 py-1 rounded-md text-[11px] font-medium bg-black/40 text-white/80", children: [
            "Style: ",
            adjustments.movement
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 362,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 358,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: `relative rounded-xl overflow-hidden shadow-2xl transition-all duration-300 w-full ${aspectClass} border border-white/10`,
            children: [
              post.imageUrl ? /* @__PURE__ */ jsxDEV("img", { src: post.imageUrl, alt: post.title, referrerPolicy: "no-referrer", style: { filter: filterString }, className: "w-full h-full object-cover transition-all duration-200" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 372,
                columnNumber: 32
              }) : /* @__PURE__ */ jsxDEV("div", { className: "w-full h-full flex items-center justify-center bg-gradient-to-br from-[#332b29] to-[#5b0e14] text-center text-xs font-semibold text-white/80 p-6", children: [
                "No niche-matched photo yet. Search or generate one for ",
                biz.name,
                "."
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 372,
                columnNumber: 208
              }),
              adjustments.vignette > 0 && /* @__PURE__ */ jsxDEV(
                "div",
                {
                  className: "absolute inset-0 pointer-events-none transition-opacity",
                  style: {
                    background: `radial-gradient(circle at center, transparent 35%, rgba(0,0,0,${adjustments.vignette / 100 * 0.85}) 100%)`
                  }
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 376,
                  columnNumber: 17
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 387,
                columnNumber: 15
              }),
              adjustments.movement === "brutalism" && /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-x-4 bottom-4 p-4 border-2 border-black shadow-[4px_4px_0px_#000000] z-10", style: { backgroundColor: primaryColor }, children: [
                /* @__PURE__ */ jsxDEV("div", { className: "h-1.5 w-full mb-3", style: { backgroundColor: accentColor } }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 392,
                  columnNumber: 19
                }),
                /* @__PURE__ */ jsxDEV(
                  "h3",
                  {
                    className: "text-lg sm:text-xl font-bold tracking-tight text-white uppercase leading-snug",
                    style: { fontFamily: selectedFont, color: headlineColor },
                    children: headline
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 393,
                    columnNumber: 19
                  }
                ),
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between mt-2 pt-2 border-t border-white/20 text-[10px] font-bold tracking-wider", style: { color: subtitleColor }, children: [
                  /* @__PURE__ */ jsxDEV("span", { children: photoEnglishText(subtitle) }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 400,
                    columnNumber: 21
                  }),
                  /* @__PURE__ */ jsxDEV("span", { children: post.platform.toUpperCase() }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 401,
                    columnNumber: 21
                  })
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 399,
                  columnNumber: 19
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 391,
                columnNumber: 17
              }),
              adjustments.movement === "glassmorphism" && /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-x-4 bottom-4 p-4 rounded-xl backdrop-blur-md bg-white/15 border border-white/30 shadow-lg text-white z-10", children: [
                /* @__PURE__ */ jsxDEV(
                  "span",
                  {
                    className: "inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mb-2 text-[#1d211b]",
                    style: { backgroundColor: accentColor },
                    children: photoEnglishText(biz.name)
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 408,
                    columnNumber: 19
                  }
                ),
                /* @__PURE__ */ jsxDEV(
                  "h3",
                  {
                    className: "text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-sm leading-snug",
                    style: { fontFamily: selectedFont, color: headlineColor },
                    children: headline
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 414,
                    columnNumber: 19
                  }
                ),
                /* @__PURE__ */ jsxDEV("p", { className: "text-[11px] mt-1 line-clamp-1", style: { fontFamily: selectedSubFont, color: subtitleColor }, children: photoEnglishText(subtitle) }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 420,
                  columnNumber: 19
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 407,
                columnNumber: 17
              }),
              adjustments.movement !== "brutalism" && adjustments.movement !== "glassmorphism" && /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-x-5 bottom-5 text-white z-10", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "w-10 h-1 mb-2.5 rounded-full", style: { backgroundColor: accentColor } }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 426,
                  columnNumber: 19
                }),
                /* @__PURE__ */ jsxDEV(
                  "h3",
                  {
                    className: "text-lg sm:text-2xl font-bold tracking-tight text-white leading-tight drop-shadow-md break-words line-clamp-2",
                    style: { fontFamily: selectedFont, color: headlineColor },
                    children: headline
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 427,
                    columnNumber: 19
                  }
                ),
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between mt-3 pt-2 border-t border-white/20 text-xs font-medium text-white/90", children: [
                  /* @__PURE__ */ jsxDEV("span", { className: "font-semibold tracking-wide text-[10px] break-words", style: { fontFamily: selectedSubFont, color: subtitleColor }, children: photoEnglishText(subtitle) }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 434,
                    columnNumber: 21
                  }),
                  /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold tracking-wider", style: { color: accentColor }, children: post.platform.toUpperCase() }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 435,
                    columnNumber: 21
                  })
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 433,
                  columnNumber: 19
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 425,
                columnNumber: 19
              })
            ]
          },
          void 0,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 368,
            columnNumber: 13
          }
        ),
        /* @__PURE__ */ jsxDEV("div", { className: "mt-4 flex flex-wrap gap-2 justify-center z-20", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => handleApplyPreset("clean"),
              className: "px-2.5 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors",
              children: "Clean & Crisp"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 445,
              columnNumber: 15
            }
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => handleApplyPreset("golden"),
              className: "px-2.5 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 text-[#f1e194] font-medium transition-colors",
              children: "Golden Hour"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 451,
              columnNumber: 15
            }
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => handleApplyPreset("moody"),
              className: "px-2.5 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors",
              children: "Moody Noir"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 457,
              columnNumber: 15
            }
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => handleApplyPreset("vibrant"),
              className: "px-2.5 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 text-[#fd802e] font-medium transition-colors",
              children: "Vibrant Pop"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 463,
              columnNumber: 15
            }
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => handleApplyPreset("vintage"),
              className: "px-2.5 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 text-[#acc8a2] font-medium transition-colors",
              children: "Vintage Film"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 469,
              columnNumber: 15
            }
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => handleApplyPreset("reset"),
              className: "px-2.5 py-1 text-xs rounded-full bg-white/5 hover:bg-white/15 text-white/60 font-medium transition-colors",
              children: "Reset"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 475,
              columnNumber: 15
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 444,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 356,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "lg:col-span-5 flex flex-col bg-[#fffdf9] overflow-y-auto", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex border-b border-[#e8e2d8] px-4 bg-[#fcfaf4]", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => setActiveTab("bot"),
              className: `py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "bot" ? "border-[#5b0e14] text-[#5b0e14]" : "border-transparent text-[#73796f] hover:text-[#1d211b]"}`,
              children: [
                /* @__PURE__ */ jsxDEV(Sparkles, { className: "w-3.5 h-3.5" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 496,
                  columnNumber: 17
                }),
                /* @__PURE__ */ jsxDEV("span", { children: "Visual Editor Bot" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 497,
                  columnNumber: 17
                })
              ]
            },
            void 0,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 488,
              columnNumber: 15
            }
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => setActiveTab("layout"),
              className: `py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "layout" ? "border-[#5b0e14] text-[#5b0e14]" : "border-transparent text-[#73796f] hover:text-[#1d211b]"}`,
              children: [
                /* @__PURE__ */ jsxDEV(Maximize2, { className: "w-3.5 h-3.5" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 507,
                  columnNumber: 17
                }),
                /* @__PURE__ */ jsxDEV("span", { children: "Aspect & Style" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 508,
                  columnNumber: 17
                })
              ]
            },
            void 0,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 499,
              columnNumber: 15
            }
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => setActiveTab("filters"),
              className: `py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "filters" ? "border-[#5b0e14] text-[#5b0e14]" : "border-transparent text-[#73796f] hover:text-[#1d211b]"}`,
              children: [
                /* @__PURE__ */ jsxDEV(Sliders, { className: "w-3.5 h-3.5" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 518,
                  columnNumber: 17
                }),
                /* @__PURE__ */ jsxDEV("span", { children: "Lighting & Color" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 519,
                  columnNumber: 17
                })
              ]
            },
            void 0,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 510,
              columnNumber: 15
            }
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => setActiveTab("typography"),
              className: `py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "typography" ? "border-[#5b0e14] text-[#5b0e14]" : "border-transparent text-[#73796f] hover:text-[#1d211b]"}`,
              children: [
                /* @__PURE__ */ jsxDEV(Type, { className: "w-3.5 h-3.5" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 529,
                  columnNumber: 17
                }),
                /* @__PURE__ */ jsxDEV("span", { children: "Typography" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 530,
                  columnNumber: 17
                })
              ]
            },
            void 0,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 521,
              columnNumber: 15
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 487,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "p-6 flex-1 space-y-6", children: [
          activeTab === "bot" && /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "p-4 rounded-xl bg-gradient-to-br from-[#421017] to-[#5b0e14] text-[#fff8ed] shadow-md", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 mb-1.5", children: [
                /* @__PURE__ */ jsxDEV(Sparkles, { className: "w-4 h-4 text-[#f1e194]" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 541,
                  columnNumber: 23
                }),
                /* @__PURE__ */ jsxDEV("h4", { className: "text-sm font-bold text-[#f1e194]", children: "Ask Visual Editor Bot" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 542,
                  columnNumber: 23
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 540,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#eadbd4] leading-relaxed", children: [
                "Describe how you want to adjust this image. The bot calculates optimal lighting, crop ratios, typography, and design movement for ",
                post.platform,
                "."
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 544,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "mt-3 flex gap-2", children: [
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "text",
                    value: botPrompt,
                    onChange: (e) => setBotPrompt(e.target.value),
                    onKeyDown: (e) => e.key === "Enter" && handleBotAdjust(),
                    placeholder: "e.g. Make it moody with warm shadows and bold serif typography...",
                    className: "flex-1 px-3 py-2 text-xs rounded-lg bg-white text-[#1d211b] placeholder:text-[#8a887b] focus:outline-none focus:ring-2 focus:ring-[#f1e194]"
                  },
                  void 0,
                  false,
                  {
                    fileName: "<stdin>",
                    lineNumber: 550,
                    columnNumber: 23
                  }
                ),
                /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    onClick: () => handleBotAdjust(),
                    disabled: isBotThinking || !botPrompt.trim(),
                    className: "px-3.5 py-2 rounded-lg bg-[#f1e194] text-[#5b0e14] font-bold text-xs hover:bg-[#fff2ab] disabled:opacity-50 transition-colors flex items-center gap-1.5",
                    children: [
                      isBotThinking ? /* @__PURE__ */ jsxDEV(RefreshCw, { className: "w-3.5 h-3.5 animate-spin" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 564,
                        columnNumber: 27
                      }) : /* @__PURE__ */ jsxDEV(Wand2, { className: "w-3.5 h-3.5" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 566,
                        columnNumber: 27
                      }),
                      /* @__PURE__ */ jsxDEV("span", { children: "Adjust" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 568,
                        columnNumber: 25
                      })
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "<stdin>",
                    lineNumber: 558,
                    columnNumber: 23
                  }
                )
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 549,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 539,
              columnNumber: 19
            }),
            botMessage && /* @__PURE__ */ jsxDEV("div", { className: "p-3.5 rounded-xl bg-[#eef4e9] border border-[#d6e3ce] text-[#2c3d25] text-xs leading-relaxed animate-fade-in flex items-start gap-2.5", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "w-5 h-5 rounded-full bg-[#527247] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5", children: "VE" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 575,
                columnNumber: 23
              }),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("strong", { className: "block text-[#1a2517] font-semibold mb-0.5", children: "Visual Editor Bot:" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 579,
                  columnNumber: 25
                }),
                /* @__PURE__ */ jsxDEV("span", { children: botMessage }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 580,
                  columnNumber: 25
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 578,
                columnNumber: 23
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 574,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-2", children: "Quick Bot Adjustments" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 586,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2", children: [
                { label: "TikTok 9:16 Story Crop", cmd: "Crop 9:16 for TikTok with punchy contrast and bold headline" },
                { label: "Moody Cinematic Coffee", cmd: "Deepen shadows, rich warmth, gentle vignette, DM Serif Display" },
                { label: "Frosted Glassmorphism", cmd: "Apply glassmorphism overlay with soft translucent badge" },
                { label: "Brutalist High Impact", cmd: "Bold brutalist card with strong borders and punchy typography" },
                { label: "Scandinavian Minimal", cmd: "Soft natural light, lowered contrast, elegant subtle type" },
                { label: "Golden Morning Light", cmd: "Boost golden warmth and gentle highlights for breakfast feel" }
              ].map((item, idx) => /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => handleBotAdjust(item.cmd),
                  disabled: isBotThinking,
                  className: "p-2.5 rounded-xl border border-[#e8e2d8] hover:border-[#5b0e14] hover:bg-[#fffcf7] text-left text-xs transition-all group",
                  children: [
                    /* @__PURE__ */ jsxDEV("strong", { className: "block text-[#1d211b] group-hover:text-[#5b0e14] font-semibold", children: item.label }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 604,
                      columnNumber: 27
                    }),
                    /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-[#85867c] line-clamp-1", children: item.cmd }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 607,
                      columnNumber: 27
                    })
                  ]
                },
                idx,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 598,
                  columnNumber: 25
                }
              )) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 589,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 585,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 538,
            columnNumber: 17
          }),
          activeTab === "layout" && /* @__PURE__ */ jsxDEV("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-2", children: "Aspect Ratio" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 619,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-4 gap-2", children: [
                { ratio: "1:1", label: "1:1 Square", sub: "Instagram Feed" },
                { ratio: "4:5", label: "4:5 Portrait", sub: "IG / FB Feed" },
                { ratio: "9:16", label: "9:16 Story", sub: "TikTok / Reels" },
                { ratio: "16:9", label: "16:9 Wide", sub: "LinkedIn / Web" }
              ].map((item) => /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => setAdjustments((prev) => ({ ...prev, aspectRatio: item.ratio })),
                  className: `p-2.5 rounded-xl border text-center transition-all ${adjustments.aspectRatio === item.ratio ? "border-[#5b0e14] bg-[#fbf5f2] text-[#5b0e14] font-bold shadow-sm" : "border-[#e8e2d8] bg-white text-[#493f38] hover:bg-[#faf6ee]"}`,
                  children: [
                    /* @__PURE__ */ jsxDEV("span", { className: "block text-xs", children: item.label }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 640,
                      columnNumber: 27
                    }),
                    /* @__PURE__ */ jsxDEV("span", { className: "block text-[9px] text-[#85867c] mt-0.5", children: item.sub }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 641,
                      columnNumber: 27
                    })
                  ]
                },
                item.ratio,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 629,
                  columnNumber: 25
                }
              )) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 622,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 618,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-2", children: "Design Movement & Card Style" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 648,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 gap-2", children: [
                { id: "editorial", label: "Editorial Classic", desc: "Elegant gradient bar & fine serif" },
                { id: "glassmorphism", label: "Glassmorphism", desc: "Translucent frosted glass card" },
                { id: "brutalism", label: "Neo-Brutalism", desc: "Solid black stroke & bold badge" },
                { id: "minimalist", label: "Minimalist Serene", desc: "Clean quiet type & natural look" },
                { id: "claymorphism", label: "Claymorphic", desc: "Soft pillowy rounded cards" },
                { id: "retro-y2k", label: "Retro Y2K", desc: "Warm chromatic nostalgic accents" }
              ].map((item) => /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => setAdjustments((prev) => ({ ...prev, movement: item.id })),
                  className: `p-3 rounded-xl border text-left transition-all ${adjustments.movement === item.id ? "border-[#5b0e14] bg-[#fbf5f2] text-[#5b0e14] font-bold shadow-sm" : "border-[#e8e2d8] bg-white text-[#493f38] hover:bg-[#faf6ee]"}`,
                  children: [
                    /* @__PURE__ */ jsxDEV("strong", { className: "block text-xs", children: item.label }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 671,
                      columnNumber: 27
                    }),
                    /* @__PURE__ */ jsxDEV("span", { className: "block text-[10px] text-[#85867c] mt-0.5", children: item.desc }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 672,
                      columnNumber: 27
                    })
                  ]
                },
                item.id,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 660,
                  columnNumber: 25
                }
              )) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 651,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 647,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 617,
            columnNumber: 17
          }),
          activeTab === "filters" && /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-xs font-semibold mb-1 text-[#493f38]", children: [
                /* @__PURE__ */ jsxDEV("span", { children: "Brightness" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 686,
                  columnNumber: 23
                }),
                /* @__PURE__ */ jsxDEV("span", { children: [
                  adjustments.brightness,
                  "%"
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 687,
                  columnNumber: 23
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 685,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "range",
                  min: "80",
                  max: "140",
                  value: adjustments.brightness,
                  onChange: (e) => setAdjustments((prev) => ({ ...prev, brightness: Number(e.target.value) })),
                  className: "w-full accent-[#5b0e14]"
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 689,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 684,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-xs font-semibold mb-1 text-[#493f38]", children: [
                /* @__PURE__ */ jsxDEV("span", { children: "Contrast" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 704,
                  columnNumber: 23
                }),
                /* @__PURE__ */ jsxDEV("span", { children: [
                  adjustments.contrast,
                  "%"
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 705,
                  columnNumber: 23
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 703,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "range",
                  min: "80",
                  max: "150",
                  value: adjustments.contrast,
                  onChange: (e) => setAdjustments((prev) => ({ ...prev, contrast: Number(e.target.value) })),
                  className: "w-full accent-[#5b0e14]"
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 707,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 702,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-xs font-semibold mb-1 text-[#493f38]", children: [
                /* @__PURE__ */ jsxDEV("span", { children: "Saturation" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 722,
                  columnNumber: 23
                }),
                /* @__PURE__ */ jsxDEV("span", { children: [
                  adjustments.saturation,
                  "%"
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 723,
                  columnNumber: 23
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 721,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "range",
                  min: "50",
                  max: "160",
                  value: adjustments.saturation,
                  onChange: (e) => setAdjustments((prev) => ({ ...prev, saturation: Number(e.target.value) })),
                  className: "w-full accent-[#5b0e14]"
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 725,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 720,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-xs font-semibold mb-1 text-[#493f38]", children: [
                /* @__PURE__ */ jsxDEV("span", { children: "Color Warmth" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 740,
                  columnNumber: 23
                }),
                /* @__PURE__ */ jsxDEV("span", { children: adjustments.warmth > 0 ? `+${adjustments.warmth}` : adjustments.warmth }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 741,
                  columnNumber: 23
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 739,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "range",
                  min: "-30",
                  max: "30",
                  value: adjustments.warmth,
                  onChange: (e) => setAdjustments((prev) => ({ ...prev, warmth: Number(e.target.value) })),
                  className: "w-full accent-[#5b0e14]"
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 743,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 738,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between text-xs font-semibold mb-1 text-[#493f38]", children: [
                /* @__PURE__ */ jsxDEV("span", { children: "Vignette Edge Shadow" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 758,
                  columnNumber: 23
                }),
                /* @__PURE__ */ jsxDEV("span", { children: [
                  adjustments.vignette,
                  "%"
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 759,
                  columnNumber: 23
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 757,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "range",
                  min: "0",
                  max: "60",
                  value: adjustments.vignette,
                  onChange: (e) => setAdjustments((prev) => ({ ...prev, vignette: Number(e.target.value) })),
                  className: "w-full accent-[#5b0e14]"
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 761,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 756,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 682,
            columnNumber: 17
          }),
          activeTab === "typography" && /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Overlay Headline" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 779,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "text",
                  value: headline,
                  onChange: (e) => setHeadline(photoEnglishText(e.target.value)),
                  placeholder: "Headline text on artwork...",
                  className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 782,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 778,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Overlay Subtitle" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 792,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "text",
                  value: subtitle,
                  onChange: (e) => setSubtitle(photoEnglishText(e.target.value)),
                  placeholder: "Subtitle text on artwork...",
                  className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 795,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 791,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Headline Font Family" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 805,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "select",
                {
                  value: selectedFont,
                  onChange: (e) => setSelectedFont(e.target.value),
                  className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]",
                  children: fontOptions.map((f) => /* @__PURE__ */ jsxDEV("option", { value: f, style: { fontFamily: f }, children: f }, f, false, {
                    fileName: "<stdin>",
                    lineNumber: 814,
                    columnNumber: 25
                  }))
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 808,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 804,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Subtitle Font Family" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 822,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV(
                "select",
                {
                  value: selectedSubFont,
                  onChange: (e) => setSelectedSubFont(e.target.value),
                  className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]",
                  children: fontOptions.map((f) => /* @__PURE__ */ jsxDEV("option", { value: f, style: { fontFamily: f }, children: f }, f, false, {
                    fileName: "<stdin>",
                    lineNumber: 831,
                    columnNumber: 25
                  }))
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 825,
                  columnNumber: 21
                }
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 821,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider", children: [
                "Headline Color",
                /* @__PURE__ */ jsxDEV("input", { type: "color", value: headlineColor, onChange: (e) => setHeadlineColor(e.target.value), className: "mt-1 block h-9 w-full rounded-lg border border-[#ded8cc] bg-white p-1" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 839,
                  columnNumber: 23
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 837,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider", children: [
                "Subtitle Color",
                /* @__PURE__ */ jsxDEV("input", { type: "color", value: subtitleColor, onChange: (e) => setSubtitleColor(e.target.value), className: "mt-1 block h-9 w-full rounded-lg border border-[#ded8cc] bg-white p-1" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 843,
                  columnNumber: 23
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 841,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 836,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "p-3.5 rounded-xl bg-[#f5f1e9] border border-[#e8e2d8]", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-[11px] font-bold text-[#73796f] uppercase tracking-wider block mb-2", children: "Brand Palette Attached" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 848,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "w-6 h-6 rounded-md shadow-sm border border-black/10", style: { backgroundColor: primaryColor } }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 853,
                    columnNumber: 25
                  }),
                  /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-mono", children: primaryColor }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 854,
                    columnNumber: 25
                  })
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 852,
                  columnNumber: 23
                }),
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "w-6 h-6 rounded-md shadow-sm border border-black/10", style: { backgroundColor: accentColor } }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 857,
                    columnNumber: 25
                  }),
                  /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-mono", children: accentColor }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 858,
                    columnNumber: 25
                  })
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 856,
                  columnNumber: 23
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 851,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 847,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 777,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 535,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "p-4 border-t border-[#e8e2d8] bg-[#fcfaf4] flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: handleDownload,
              disabled: isDownloading,
              className: "px-4 py-2.5 rounded-xl border border-[#ded8cc] bg-white text-xs font-bold text-[#493f38] hover:bg-[#f4efe4] transition-colors flex items-center gap-1.5 shadow-sm",
              children: [
                /* @__PURE__ */ jsxDEV(Download, { className: "w-3.5 h-3.5 text-[#5b0e14]" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 873,
                  columnNumber: 17
                }),
                /* @__PURE__ */ jsxDEV("span", { children: isDownloading ? "Compositing..." : "Download Artwork" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 874,
                  columnNumber: 17
                })
              ]
            },
            void 0,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 868,
              columnNumber: 15
            }
          ),
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: onClose,
                className: "px-4 py-2.5 rounded-xl border border-[#ded8cc] text-xs font-semibold text-[#73796f] hover:bg-[#f4efe4] transition-colors",
                children: "Cancel"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 878,
                columnNumber: 17
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: handleSaveAndApprove,
                className: "px-5 py-2.5 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] shadow-md transition-all flex items-center gap-1.5",
                children: [
                  /* @__PURE__ */ jsxDEV(Check, { className: "w-4 h-4 text-[#f1e194]" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 888,
                    columnNumber: 19
                  }),
                  /* @__PURE__ */ jsxDEV("span", { children: "Save & Approve" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 889,
                    columnNumber: 19
                  })
                ]
              },
              void 0,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 884,
                columnNumber: 17
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 877,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 867,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 485,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 354,
      columnNumber: 9
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 299,
    columnNumber: 7
  }) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 298,
    columnNumber: 5
  });
};
export {
  PhotoAdjusterModal
};
