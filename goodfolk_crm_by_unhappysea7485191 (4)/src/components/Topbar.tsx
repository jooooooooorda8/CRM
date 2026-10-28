import { jsxDEV } from "react/jsx-dev-runtime";
const Topbar = ({ currentBiz, currentView }) => {
  const viewTitles = {
    overview: "Overview",
    businesses: "Businesses & Subaccounts",
    studio: "Creative Studio",
    content: "Content Calendar",
    workflows: "Workflows",
    swarm: "Swarm Engine",
    agents: "Bot Team & Task Queue",
    chat: "Team Chat",
    learning: "Review & Learning",
    settings: "Settings"
  };
  return /* @__PURE__ */ jsxDEV("header", { className: "h-16 px-6 sm:px-8 border-b border-[#e8e2d8] bg-[#fffdf9]/90 backdrop-blur-md flex items-center justify-between shrink-0 z-10 sticky top-0", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 text-xs", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "text-[#85867c] font-medium", children: currentBiz.name }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 28,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("span", { className: "text-[#ded8cc]", children: "/" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 29,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("strong", { className: "text-[#1d211b] font-bold", children: viewTitles[currentView] || "Overview" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 30,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 27,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#eef4e9] text-[#527247] border border-[#d6e3ce]", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "w-1.5 h-1.5 rounded-full bg-[#527247] animate-pulse" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 36,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("span", { children: "Owner account active" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 37,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 35,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "w-8 h-8 rounded-full bg-[#f1e194] text-[#5b0e14] font-bold text-xs flex items-center justify-center border border-[#e8dd9b] shadow-xs", children: "DB" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 40,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 34,
      columnNumber: 7
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 25,
    columnNumber: 5
  });
};
export {
  Topbar
};
