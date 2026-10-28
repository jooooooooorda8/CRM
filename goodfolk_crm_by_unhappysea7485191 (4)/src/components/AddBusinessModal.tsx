import { jsxDEV } from "react/jsx-dev-runtime";
import { useState } from "react";
import { classifyEgyptianNiche } from "../../data/egyptian-niches.js";
import { X, Building2 } from "lucide-react";
const AddBusinessModal = ({ onClose, onAddBusiness, showToast, initialBusiness }) => {
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(() => ({
    name: initialBusiness?.name || "",
    industry: initialBusiness?.industry || "",
    subNiche: initialBusiness?.businessProfile?.subNiche || "",
    offer: initialBusiness?.businessProfile?.offer || "",
    description: initialBusiness?.businessProfile?.verifiedDescription || initialBusiness?.description || "",
    audience: initialBusiness?.businessProfile?.audience || initialBusiness?.audience || "",
    goal: initialBusiness?.businessProfile?.goal || "Sales and orders",
    cta: initialBusiness?.businessProfile?.callToAction || "",
    tone: initialBusiness?.businessProfile?.brandVoice || initialBusiness?.tone || "Warm, grounded, a little adventurous",
    websiteUrl: initialBusiness?.websiteUrl || "",
    logoUrl: initialBusiness?.logoUrl || "",
    primaryColor: initialBusiness?.websiteInsights?.colors?.[0] || "#5B0E14",
    accentColor: initialBusiness?.websiteInsights?.colors?.[1] || "#F1E194",
    serviceArea: initialBusiness?.businessProfile?.serviceArea || "",
    restrictions: initialBusiness?.businessProfile?.restrictions || "",
    regulatoryNotes: initialBusiness?.businessProfile?.regulatoryNotes || "",
    visualDirection: initialBusiness?.businessProfile?.visualDirection || "",
    differentiator: initialBusiness?.businessProfile?.differentiator || "",
    verified: initialBusiness?.businessProfile?.verified || false,
    channels: initialBusiness?.channels || ["Instagram", "Facebook", "TikTok"]
  }));
  const detectedNiche = formData.industry.trim() ? classifyEgyptianNiche({ query: formData.industry, business: { name: formData.name, industry: formData.industry, businessProfile: { offer: formData.offer, audience: formData.audience } } }) : null;
  const toggleChannel = (channel) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel) ? prev.channels.filter((c) => c !== channel) : [...prev.channels, channel]
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.industry.trim()) {
      showToast("Please provide a business name and niche");
      return;
    }
    const verifiedAt = formData.verified ? (/* @__PURE__ */ new Date()).toISOString() : void 0;
    const newBiz = {
      ...initialBusiness || {},
      id: initialBusiness?.id || `biz-${Date.now()}`,
      name: formData.name.trim(),
      industry: formData.industry.trim(),
      initial: formData.name.trim().charAt(0).toUpperCase(),
      theme: initialBusiness?.theme || "burgundy",
      headingFont: initialBusiness?.headingFont || "DM Serif Display",
      bodyFont: initialBusiness?.bodyFont || "DM Sans",
      tone: formData.tone,
      audience: formData.audience,
      channels: formData.channels,
      description: formData.description.trim(),
      websiteUrl: formData.websiteUrl.trim(),
      logoUrl: formData.logoUrl.trim() || void 0,
      websiteInsights: {
        ...initialBusiness?.websiteInsights,
        title: initialBusiness?.websiteInsights?.title || formData.name,
        description: formData.description,
        colors: [.../* @__PURE__ */ new Set([formData.primaryColor, formData.accentColor, ...(initialBusiness?.websiteInsights?.colors || []).slice(2)])],
        fonts: initialBusiness?.websiteInsights?.fonts || [initialBusiness?.headingFont || "DM Serif Display", initialBusiness?.bodyFont || "DM Sans"],
        fetchedAt: initialBusiness?.websiteInsights?.fetchedAt
      },
      businessProfile: {
        ...initialBusiness?.businessProfile,
        verified: formData.verified,
        verifiedAt,
        verifiedDescription: formData.description.trim(),
        subNiche: formData.subNiche.trim(),
        offer: formData.offer.trim(),
        differentiator: formData.differentiator.trim(),
        audience: formData.audience,
        goal: formData.goal,
        callToAction: formData.cta,
        brandVoice: formData.tone,
        serviceArea: formData.serviceArea,
        restrictions: formData.restrictions,
        regulatoryNotes: formData.regulatoryNotes.trim(),
        visualDirection: formData.visualDirection.trim(),
        channels: formData.channels
      },
      createdAt: initialBusiness?.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    };
    setIsSaving(true);
    let saved;
    try {
      saved = await onAddBusiness(newBiz);
    } catch (error) {
      showToast(error.message || "Could not save this profile.");
      return;
    } finally {
      setIsSaving(false);
    }
    if (saved === false) return;
    showToast(initialBusiness ? `Client profile saved for ${newBiz.name}.` : `Workspace and workflow created for ${newBiz.name}!`);
    onClose();
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-[#fffdf9] border border-[#e8e2d8] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-[#1d211b]", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between px-6 py-4 border-b border-[#e8e2d8] bg-[#fcfaf4]", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2.5", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "w-8 h-8 rounded-lg bg-[#5b0e14] text-[#f1e194] flex items-center justify-center font-bold text-xs", children: /* @__PURE__ */ jsxDEV(Building2, { className: "w-4 h-4" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 120,
          columnNumber: 15
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 119,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h2", { className: "text-base font-bold text-[#1d211b]", children: initialBusiness ? "Edit Client Intelligence Profile" : "Add Business Subaccount" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 123,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f]", children: initialBusiness ? "Update the facts and brand context used by this business\u2019s bots." : "Creates a brand workspace, visual library, and bot workflow." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 124,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 122,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 118,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: onClose,
          className: "p-1.5 rounded-lg text-[#85867c] hover:bg-[#f2ece1] hover:text-[#1d211b] transition-colors",
          children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 131,
            columnNumber: 13
          })
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 127,
          columnNumber: 11
        }
      )
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 117,
      columnNumber: 9
    }),
    /* @__PURE__ */ jsxDEV("form", { onSubmit: handleSubmit, className: "p-6 flex-1 overflow-y-auto space-y-4", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Business Name *" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 139,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "text",
              required: true,
              value: formData.name,
              onChange: (e) => setFormData({ ...formData, name: e.target.value }),
              placeholder: "e.g. Hearth & Pine Bakery",
              className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 142,
              columnNumber: 15
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 138,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Industry / Niche *" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 152,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "text",
              required: true,
              value: formData.industry,
              onChange: (e) => setFormData({ ...formData, industry: e.target.value }),
              placeholder: "e.g. Artisanal Bakery & Cafe",
              className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 155,
              columnNumber: 15
            }
          ),
          detectedNiche && /* @__PURE__ */ jsxDEV("p", { className: "mt-1 text-[10px] text-[#527247]", children: [
            "Image and copy match: ",
            /* @__PURE__ */ jsxDEV("strong", { children: detectedNiche.category }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 163,
              columnNumber: 102
            }),
            " \xB7 ",
            detectedNiche.subNiche
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 163,
            columnNumber: 33
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 151,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 137,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Sub-niche" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 168,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("input", { value: formData.subNiche, onChange: (e) => setFormData({ ...formData, subNiche: e.target.value }), placeholder: "Specific products, specialties, or audience", className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 169,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 167,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "City / Service Area" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 174,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("input", { type: "text", value: formData.serviceArea, onChange: (e) => setFormData({ ...formData, serviceArea: e.target.value }), placeholder: "e.g. New Cairo, Alexandria, Egypt", className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 175,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 173,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Primary Business Goal" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 178,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("input", { type: "text", value: formData.goal, onChange: (e) => setFormData({ ...formData, goal: e.target.value }), placeholder: "e.g. Book appointments, sales, awareness", className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 179,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 177,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 172,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Claims, topics, or imagery to avoid" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 184,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("textarea", { rows: 2, value: formData.restrictions, onChange: (e) => setFormData({ ...formData, restrictions: e.target.value }), placeholder: "e.g. No unverified medical claims, no competitor names, no customer faces without consent", className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 185,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 183,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Products or Services *" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 189,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV(
          "textarea",
          {
            required: !initialBusiness,
            rows: 2,
            value: formData.offer,
            onChange: (e) => setFormData({ ...formData, offer: e.target.value }),
            placeholder: "What does the business sell or provide? e.g. Sourdough bread, morning pastries, seasonal tarts",
            className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 192,
            columnNumber: 13
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 188,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Business Description *" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 203,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV(
          "textarea",
          {
            required: true,
            rows: 2,
            value: formData.description,
            onChange: (e) => setFormData({ ...formData, description: e.target.value }),
            placeholder: "Describe the business using confirmed facts. Unverified claims are excluded from bot copy.",
            className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 206,
            columnNumber: 13
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 202,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "What Makes It Different?" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 218,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("textarea", { rows: 2, value: formData.differentiator, onChange: (e) => setFormData({ ...formData, differentiator: e.target.value }), placeholder: "Supported differentiators only", className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 221,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 217,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Target Audience" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 224,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "text",
              value: formData.audience,
              onChange: (e) => setFormData({ ...formData, audience: e.target.value }),
              placeholder: "e.g. Neighborhood regulars, food enthusiasts",
              className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 227,
              columnNumber: 15
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 223,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Brand Voice & Tone" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 236,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "text",
              value: formData.tone,
              onChange: (e) => setFormData({ ...formData, tone: e.target.value }),
              placeholder: "e.g. Warm, inviting, honest",
              className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 239,
              columnNumber: 15
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 235,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 216,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Call to Action" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 251,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "text",
              value: formData.cta,
              onChange: (e) => setFormData({ ...formData, cta: e.target.value }),
              placeholder: "e.g. Order ahead for pickup",
              className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 254,
              columnNumber: 15
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 250,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Official Website (optional)" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 263,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "url",
              value: formData.websiteUrl,
              onChange: (e) => setFormData({ ...formData, websiteUrl: e.target.value }),
              placeholder: "https://example.com",
              className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 266,
              columnNumber: 15
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 262,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 249,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Logo URL" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 277,
            columnNumber: 18
          }),
          /* @__PURE__ */ jsxDEV("input", { type: "url", value: formData.logoUrl, onChange: (e) => setFormData({ ...formData, logoUrl: e.target.value }), placeholder: "https://example.com/logo.png", className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 277,
            columnNumber: 122
          }),
          /* @__PURE__ */ jsxDEV("label", { className: "mt-2 block text-[10px] font-semibold text-[#73796f]", children: [
            isUploadingLogo ? "Uploading logo\u2026" : "Or upload a logo",
            /* @__PURE__ */ jsxDEV("input", { type: "file", accept: "image/*", disabled: isUploadingLogo, className: "block w-full mt-1 text-[10px]", onChange: async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setIsUploadingLogo(true);
              try {
                const url = await window.websim.upload(file);
                setFormData((prev) => ({ ...prev, logoUrl: url }));
                showToast("Logo uploaded. Save the profile to keep it.");
              } catch (error) {
                showToast(error.message || "Logo upload failed.");
              } finally {
                setIsUploadingLogo(false);
                event.target.value = "";
              }
            } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 277,
              columnNumber: 492
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 277,
            columnNumber: 363
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 277,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider", children: [
            "Primary color",
            /* @__PURE__ */ jsxDEV("input", { type: "color", value: formData.primaryColor, onChange: (e) => setFormData({ ...formData, primaryColor: e.target.value }), className: "block w-full h-9 mt-1 rounded-lg border border-[#ded8cc]" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 278,
              columnNumber: 143
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 278,
            columnNumber: 53
          }),
          /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider", children: [
            "Accent color",
            /* @__PURE__ */ jsxDEV("input", { type: "color", value: formData.accentColor, onChange: (e) => setFormData({ ...formData, accentColor: e.target.value }), className: "block w-full h-9 mt-1 rounded-lg border border-[#ded8cc]" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 278,
              columnNumber: 438
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 278,
            columnNumber: 349
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 278,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 276,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Regulatory / compliance notes" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 281,
            columnNumber: 71
          }),
          /* @__PURE__ */ jsxDEV("textarea", { rows: 2, value: formData.regulatoryNotes, onChange: (e) => setFormData({ ...formData, regulatoryNotes: e.target.value }), placeholder: "Required disclaimers or regulated claims", className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 281,
            columnNumber: 196
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 281,
          columnNumber: 66
        }),
        /* @__PURE__ */ jsxDEV("label", { className: "flex items-start gap-2 text-xs text-[#493f38] p-3 rounded-xl border border-[#ece8df] bg-[#faf8f2]", children: [
          /* @__PURE__ */ jsxDEV("input", { type: "checkbox", checked: formData.verified, onChange: (e) => setFormData({ ...formData, verified: e.target.checked }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 281,
            columnNumber: 589
          }),
          /* @__PURE__ */ jsxDEV("span", { children: [
            /* @__PURE__ */ jsxDEV("strong", { children: "I've verified these business facts" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 281,
              columnNumber: 723
            }),
            /* @__PURE__ */ jsxDEV("small", { className: "block text-[#73796f] mt-1", children: "Bots may state profile facts only when this is selected." }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 281,
              columnNumber: 774
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 281,
            columnNumber: 717
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 281,
          columnNumber: 472
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 281,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Visual Direction for Photography" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 284,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            type: "text",
            value: formData.visualDirection,
            onChange: (e) => setFormData({ ...formData, visualDirection: e.target.value }),
            placeholder: "e.g. Golden morning light, flour dust in air, rustic wooden boards, crisp crust textures",
            className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 287,
            columnNumber: 13
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 283,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-2", children: "Active Marketing Channels" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 297,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap gap-2", children: ["Instagram", "Facebook", "TikTok", "LinkedIn", "Pinterest"].map((channel) => /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "button",
            onClick: () => toggleChannel(channel),
            className: `px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${formData.channels.includes(channel) ? "bg-[#5b0e14] text-[#fff8ed] border-[#5b0e14]" : "bg-white text-[#73796f] border-[#ded8cc] hover:bg-[#faf6ee]"}`,
            children: channel
          },
          channel,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 302,
            columnNumber: 17
          }
        )) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 300,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 296,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "pt-4 border-t border-[#e8e2d8] flex justify-end gap-2.5", children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "button",
            onClick: onClose,
            className: "px-4 py-2 rounded-xl border border-[#ded8cc] text-xs font-semibold text-[#73796f] hover:bg-[#f4efe4] transition-colors",
            children: "Cancel"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 319,
            columnNumber: 13
          }
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "submit",
            disabled: isSaving || isUploadingLogo,
            className: "px-5 py-2 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] shadow-md transition-colors disabled:opacity-50",
            children: isSaving ? "Saving\u2026" : initialBusiness ? "Save Client Profile" : "Create Business Workspace"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 326,
            columnNumber: 13
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 318,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 136,
      columnNumber: 9
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 115,
    columnNumber: 7
  }) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 114,
    columnNumber: 5
  });
};
export {
  AddBusinessModal
};
