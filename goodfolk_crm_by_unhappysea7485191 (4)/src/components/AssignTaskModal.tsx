import { jsxDEV } from "react/jsx-dev-runtime";
import { useState } from "react";
import { X, Bot } from "lucide-react";
const AssignTaskModal = ({
  businesses,
  currentBizId,
  bots,
  onClose,
  onAssignTask,
  showToast
}) => {
  const [businessId, setBusinessId] = useState(currentBizId);
  const [botId, setBotId] = useState("editor");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [priority, setPriority] = useState("normal");
  const [isSaving, setIsSaving] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !instructions.trim()) {
      showToast("Please provide a task title and instructions");
      return;
    }
    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      businessId,
      botId,
      title: title.trim(),
      instructions: instructions.trim(),
      status: "queued",
      progress: 0,
      priority,
      engineerNote: "Assigned to the engineer team leader for supervision.",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    setIsSaving(true);
    let saved;
    try {
      saved = await onAssignTask(newTask);
    } finally {
      setIsSaving(false);
    }
    if (saved === false) return;
    showToast(`Task assigned to ${bots.find((b) => b.id === botId)?.name}!`);
    onClose();
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-[#fffdf9] border border-[#e8e2d8] rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-[#1d211b]", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between px-6 py-4 border-b border-[#e8e2d8] bg-[#fcfaf4]", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2.5", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "w-8 h-8 rounded-lg bg-[#5b0e14] text-[#f1e194] flex items-center justify-center font-bold text-xs", children: /* @__PURE__ */ jsxDEV(Bot, { className: "w-4 h-4" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 66,
          columnNumber: 15
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 65,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h2", { className: "text-base font-bold text-[#1d211b]", children: "Assign Task to Bot Team" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 69,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-[#73796f]", children: "Supervised by Team Lead & Engineer." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 70,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 68,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 64,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: onClose,
          className: "p-1.5 rounded-lg text-[#85867c] hover:bg-[#f2ece1] hover:text-[#1d211b] transition-colors",
          children: /* @__PURE__ */ jsxDEV(X, { className: "w-5 h-5" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 77,
            columnNumber: 13
          })
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 73,
          columnNumber: 11
        }
      )
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 63,
      columnNumber: 9
    }),
    /* @__PURE__ */ jsxDEV("form", { onSubmit: handleSubmit, className: "p-6 flex-1 overflow-y-auto space-y-4", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Target Business" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 85,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV(
            "select",
            {
              value: businessId,
              onChange: (e) => setBusinessId(e.target.value),
              className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]",
              children: businesses.map((b) => /* @__PURE__ */ jsxDEV("option", { value: b.id, children: b.name }, b.id, false, {
                fileName: "<stdin>",
                lineNumber: 94,
                columnNumber: 19
              }))
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 88,
              columnNumber: 15
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 84,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Assignee Bot" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 102,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV(
            "select",
            {
              value: botId,
              onChange: (e) => setBotId(e.target.value),
              className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]",
              children: bots.map((b) => /* @__PURE__ */ jsxDEV("option", { value: b.id, children: [
                b.name,
                " (",
                b.job.split("\xB7")[0],
                ")"
              ] }, b.id, true, {
                fileName: "<stdin>",
                lineNumber: 111,
                columnNumber: 19
              }))
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 105,
              columnNumber: 15
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 101,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 83,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Task Title *" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 120,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            type: "text",
            required: true,
            value: title,
            onChange: (e) => setTitle(e.target.value),
            placeholder: "e.g. Adjust coffee photos for 4:5 Instagram feed format",
            className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 123,
            columnNumber: 13
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 119,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-1", children: "Detailed Instructions *" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 134,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV(
          "textarea",
          {
            required: true,
            rows: 4,
            value: instructions,
            onChange: (e) => setInstructions(e.target.value),
            placeholder: "Specify the aesthetic goals, technical constraints, platform rules, and how the engineer should verify the result...",
            className: "w-full px-3 py-2 text-xs rounded-xl border border-[#ded8cc] bg-white focus:outline-none focus:ring-2 focus:ring-[#5b0e14]"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 137,
            columnNumber: 13
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 133,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("label", { className: "text-xs font-bold text-[#73796f] uppercase tracking-wider block mb-2", children: "Priority Level" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 148,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2", children: ["normal", "high", "urgent"].map((p) => /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "button",
            onClick: () => setPriority(p),
            className: `px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${priority === p ? "bg-[#5b0e14] text-[#fff8ed] border-[#5b0e14]" : "bg-white text-[#73796f] border-[#ded8cc] hover:bg-[#faf6ee]"}`,
            children: p
          },
          p,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 153,
            columnNumber: 17
          }
        )) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 151,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 147,
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
            lineNumber: 170,
            columnNumber: 13
          }
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "submit",
            disabled: isSaving,
            className: "px-5 py-2 rounded-xl bg-[#5b0e14] text-[#fff8ed] text-xs font-bold hover:bg-[#74131c] shadow-md transition-colors disabled:opacity-50",
            children: isSaving ? "Saving\u2026" : "Assign to Bot Team"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 177,
            columnNumber: 13
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 169,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 82,
      columnNumber: 9
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 61,
    columnNumber: 7
  }) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 60,
    columnNumber: 5
  });
};
export {
  AssignTaskModal
};
