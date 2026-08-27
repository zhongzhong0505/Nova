import { useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { CircleCheck, Info, Lightbulb, TriangleAlert, X } from "lucide-react";

export type CalloutType = "info" | "success" | "warning" | "danger" | "tip";

export const CALLOUT_TYPES: CalloutType[] = [
  "info",
  "success",
  "warning",
  "danger",
  "tip",
];

const ICONS: Record<CalloutType, typeof Info> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: X,
  tip: Lightbulb,
};

const TONE: Record<CalloutType, string> = {
  info: "text-blue-500",
  success: "text-emerald-500",
  warning: "text-amber-500",
  danger: "text-rose-500",
  tip: "text-violet-500",
};

const FALLBACK_TITLE: Record<CalloutType, Record<string, string>> = {
  info: { "zh-CN": "提示", "en-US": "Note", "ja-JP": "情報" },
  success: { "zh-CN": "成功", "en-US": "Success", "ja-JP": "成功" },
  warning: { "zh-CN": "注意", "en-US": "Warning", "ja-JP": "警告" },
  danger: { "zh-CN": "危险", "en-US": "Danger", "ja-JP": "危険" },
  tip: { "zh-CN": "技巧", "en-US": "Tip", "ja-JP": "ヒント" },
};

function CalloutView({ node, updateAttributes, editor }: NodeViewProps) {
  const type = (node.attrs.type as CalloutType) || "info";
  const [collapsed, setCollapsed] = useState(false);
  const Icon = ICONS[type] ?? Info;
  const lang =
    (typeof navigator !== "undefined" && navigator.language.startsWith("zh")
      ? "zh-CN"
      : typeof navigator !== "undefined" && navigator.language.startsWith("ja")
        ? "ja-JP"
        : "en-US") as keyof (typeof FALLBACK_TITLE)[CalloutType];
  const placeholder = FALLBACK_TITLE[type]?.[lang] ?? FALLBACK_TITLE[type]["en-US"];

  return (
    <NodeViewWrapper
      className={`ep-callout ep-callout--${type}`}
      data-callout-type={type}
    >
      <div className="pt-0.5">
        <Icon className={`h-5 w-5 ${TONE[type] ?? TONE.info}`} />
      </div>
      <div className="ep-callout__body">
        <div
          contentEditable={false}
          className="mb-1 flex items-center gap-2 select-none"
        >
          <input
            className="ep-callout__title"
            value={(node.attrs.title as string) ?? ""}
            placeholder={placeholder}
            onChange={(e) => updateAttributes({ title: e.target.value })}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <select
            className="rounded-md border border-transparent bg-transparent px-1 py-0.5 text-xs font-medium text-[color:var(--ep-muted)] outline-none hover:bg-black/5 dark:hover:bg-white/10"
            value={type}
            onChange={(e) =>
              updateAttributes({ type: e.target.value as CalloutType })
            }
            onKeyDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {CALLOUT_TYPES.map((t) => (
              <option key={t} value={t}>
                {FALLBACK_TITLE[t][lang]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="ml-auto rounded-md px-2 py-0.5 text-xs text-[color:var(--ep-muted)] hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? "▸" : "▾"}
          </button>
        </div>
        {!collapsed && <NodeViewContent className="ep-callout__content" />}
        {editor.isEditable === false && null}
      </div>
    </NodeViewWrapper>
  );
}

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  draggable: true,

  addAttributes() {
    return {
      type: {
        default: "info",
        parseHTML: (el) => el.getAttribute("data-callout-type") || "info",
        renderHTML: (attrs) => ({ "data-callout-type": attrs.type }),
      },
      title: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-title") || "",
        renderHTML: (attrs) => ({ "data-title": attrs.title || "" }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='callout']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "callout",
        class: `ep-callout ep-callout--${HTMLAttributes["data-callout-type"] ?? "info"}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCallout:
        (attrs = {}) =>
        ({ commands }) =>
          commands.wrapIn(this.name, attrs),
      toggleCallout:
        (attrs = {}) =>
        ({ commands }) =>
          commands.toggleWrap(this.name, attrs),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },
});
