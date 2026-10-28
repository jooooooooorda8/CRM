import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import {
  LayoutDashboard,
  Building2,
  Palette,
  Calendar,
  GitBranch,
  Bot,
  MessageSquare,
  BookOpen,
  Settings,
  ChevronDown,
  Plus
} from "lucide-react";
const Sidebar = ({
  currentView,
  onSelectView,
  businesses,
  currentBiz,
  onSelectBusiness,
  onOpenAddBusiness,
  todayCount,
  dailyGoal
}) => {
  const [isSwitcherOpen, setIsSwitcherOpen] = React.useState(false);
  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "businesses", label: "Businesses", icon: Building2, count: businesses.length },
    { id: "studio", label: "Creative studio", icon: Palette },
    { id: "content", label: "Content calendar", icon: Calendar },
    { id: "workflows", label: "Workflows", icon: GitBranch },
    { id: "swarm", label: "Swarm Engine", icon: Bot },
    { id: "agents", label: "Bot team", icon: Bot, hasDot: true },
    { id: "chat", label: "Team chat", icon: MessageSquare },
    { id: "learning", label: "Review & learning", icon: BookOpen },
    { id: "settings", label: "Settings", icon: Settings }
  ];
  const goalProgress = Math.min(100, Math.round(todayCount / dailyGoal * 100));
  return /* @__PURE__ */ jsxDEV("aside", { className: "w-64 bg-gradient-to-b from-[#421017] to-[#2d191d] text-[#fff8ed] flex flex-col shrink-0 border-r-0 select-none min-h-screen", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "px-5 pt-6 pb-4", children: /* @__PURE__ */ jsxDEV("a", { href: "#overview", onClick: () => onSelectView("overview"), className: "flex items-center gap-2.5 text-white no-underline", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "w-8 h-8 rounded-lg bg-black/40 border border-[#f1e194]/30 flex items-center justify-center p-1 shadow-inner", children: /* @__PURE__ */ jsxDEV("img", { src: "/goodfolk-mark.svg", alt: "Goodfolk", className: "w-full h-full object-contain" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 61,
        columnNumber: 13
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 60,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("span", { className: "font-extrabold text-xl tracking-tight text-[#fff8ed]", children: [
        "Goodfolk",
        /* @__PURE__ */ jsxDEV("span", { className: "text-[#f1e194]", children: "." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 64,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 63,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 59,
      columnNumber: 9
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 58,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "px-4 mb-4 relative", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "text-[9px] font-bold tracking-widest text-[#d4b9a9] uppercase mb-1.5 px-2", children: "OWNER ACCOUNT" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 71,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => setIsSwitcherOpen(!isSwitcherOpen),
          className: "w-full flex items-center justify-between p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 transition-all text-left",
          children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2.5 min-w-0", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "w-7 h-7 rounded-lg bg-[#5b0e14] text-[#f1e194] border border-[#f1e194]/40 flex items-center justify-center font-bold text-xs shrink-0", children: currentBiz.logoUrl ? /* @__PURE__ */ jsxDEV("img", { src: currentBiz.logoUrl, alt: "", className: "w-full h-full object-contain rounded-lg bg-white" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 81,
                columnNumber: 37
              }) : currentBiz.initial }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 80,
                columnNumber: 13
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxDEV("strong", { className: "block text-xs font-bold text-white truncate", children: currentBiz.name }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 84,
                  columnNumber: 15
                }),
                /* @__PURE__ */ jsxDEV("small", { className: "block text-[9px] text-[#d4b9a9] truncate", children: "Subaccount \xB7 owner managed" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 85,
                  columnNumber: 15
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 83,
                columnNumber: 13
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 79,
              columnNumber: 11
            }),
            /* @__PURE__ */ jsxDEV(ChevronDown, { className: "w-4 h-4 text-[#d4b9a9] shrink-0" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 88,
              columnNumber: 11
            })
          ]
        },
        void 0,
        true,
        {
          fileName: "<stdin>",
          lineNumber: 75,
          columnNumber: 9
        }
      ),
      isSwitcherOpen && /* @__PURE__ */ jsxDEV("div", { className: "absolute top-full left-4 right-4 mt-1.5 bg-[#2a1317] border border-white/20 rounded-xl shadow-2xl z-40 py-1.5 overflow-hidden animate-fade-in", children: [
        businesses.map((b) => /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => {
              onSelectBusiness(b);
              setIsSwitcherOpen(false);
            },
            className: `w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/10 transition-colors ${b.id === currentBiz.id ? "bg-white/15" : ""}`,
            children: [
              /* @__PURE__ */ jsxDEV("span", { className: "w-6 h-6 rounded bg-[#5b0e14] text-[#f1e194] text-[10px] font-bold flex items-center justify-center shrink-0 overflow-hidden", children: b.logoUrl ? /* @__PURE__ */ jsxDEV("img", { src: b.logoUrl, alt: "", className: "w-full h-full object-contain bg-white" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 106,
                columnNumber: 32
              }) : b.initial }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 105,
                columnNumber: 17
              }),
              /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-medium text-white truncate flex-1", children: b.name }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 108,
                columnNumber: 17
              }),
              b.id === currentBiz.id && /* @__PURE__ */ jsxDEV("span", { className: "w-1.5 h-1.5 rounded-full bg-[#f1e194]" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 109,
                columnNumber: 44
              })
            ]
          },
          b.id,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 95,
            columnNumber: 15
          }
        )),
        /* @__PURE__ */ jsxDEV("div", { className: "p-1.5 mt-1 border-t border-white/10", children: /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => {
              setIsSwitcherOpen(false);
              onOpenAddBusiness();
            },
            className: "w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#f1e194]/20 hover:bg-[#f1e194]/30 text-[#f1e194] text-xs font-semibold transition-colors",
            children: [
              /* @__PURE__ */ jsxDEV(Plus, { className: "w-3.5 h-3.5" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 121,
                columnNumber: 17
              }),
              /* @__PURE__ */ jsxDEV("span", { children: "Add Business" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 122,
                columnNumber: 17
              })
            ]
          },
          void 0,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 114,
            columnNumber: 15
          }
        ) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 113,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 93,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 70,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "px-3 flex-1 space-y-0.5 overflow-y-auto", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "text-[9px] font-bold tracking-widest text-[#d4b9a9] uppercase mb-1.5 px-3", children: "WORKSPACE" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 131,
        columnNumber: 9
      }),
      navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => onSelectView(item.id),
            className: `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${isActive ? "bg-[#f1e194] text-[#421017] font-bold shadow-md" : "text-[#e1d1c7] hover:bg-white/10 hover:text-white"}`,
            children: [
              /* @__PURE__ */ jsxDEV(Icon, { className: `w-4 h-4 shrink-0 ${isActive ? "text-[#5b0e14]" : "text-[#d4b9a9]"}` }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 148,
                columnNumber: 15
              }),
              /* @__PURE__ */ jsxDEV("span", { className: "truncate flex-1 text-left", children: item.label }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 149,
                columnNumber: 15
              }),
              item.count !== void 0 && /* @__PURE__ */ jsxDEV(
                "span",
                {
                  className: `px-1.5 py-0.5 rounded-md text-[9px] font-bold ${isActive ? "bg-[#421017]/20 text-[#421017]" : "bg-white/15 text-[#f1e194]"}`,
                  children: item.count
                },
                void 0,
                false,
                {
                  fileName: "<stdin>",
                  lineNumber: 152,
                  columnNumber: 17
                }
              ),
              item.hasDot && /* @__PURE__ */ jsxDEV("span", { className: "w-2 h-2 rounded-full bg-[#acc8a2] shadow-[0_0_8px_#acc8a2]" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 162,
                columnNumber: 17
              })
            ]
          },
          item.id,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 139,
            columnNumber: 13
          }
        );
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 130,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "p-4 mt-auto border-t border-white/15 space-y-3.5", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "p-3 rounded-xl bg-white/10 border border-white/10", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between text-[10px] font-bold", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-[#e1d1c7]", children: "Daily publishing goal" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 173,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("span", { className: "text-[#f1e194]", children: [
            todayCount,
            " / ",
            dailyGoal
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 174,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 172,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "w-full h-1.5 rounded-full bg-white/20 mt-2 overflow-hidden", children: /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: "h-full rounded-full bg-[#f1e194] transition-all duration-300",
            style: { width: `${goalProgress}%` }
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 179,
            columnNumber: 13
          }
        ) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 178,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("p", { className: "text-[9px] text-[#d4b9a9] mt-1.5", children: "Posts prepared today" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 184,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 171,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2.5 px-1", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "w-7 h-7 rounded-full bg-[#f1e194] text-[#421017] font-bold text-xs flex items-center justify-center shrink-0", children: "DB" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 188,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxDEV("strong", { className: "block text-xs font-bold text-white truncate", children: "Dan B Clarks" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 192,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("small", { className: "block text-[9px] text-[#d4b9a9] truncate", children: "Workspace owner" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 193,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 191,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 187,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 170,
      columnNumber: 7
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 56,
    columnNumber: 5
  });
};
export {
  Sidebar
};
