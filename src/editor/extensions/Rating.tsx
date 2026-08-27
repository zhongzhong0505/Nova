import { useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { Star } from "lucide-react";

function RatingView({ node, updateAttributes }: NodeViewProps) {
  const value = Number(node.attrs.value ?? 5);
  const [hover, setHover] = useState(0);
  const label = (node.attrs.label as string) ?? "";

  return (
    <NodeViewWrapper className="ep-rating" data-type="rating">
      <div contentEditable={false} className="flex items-center gap-3">
        <div className="ep-rating__stars" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              type="button"
              key={i}
              className={`ep-rating__star ${i <= (hover || value) ? "is-on" : ""}`}
              onMouseEnter={() => setHover(i)}
              onClick={() => updateAttributes({ value: i })}
            >
              <Star
                className="h-5 w-5"
                fill={i <= (hover || value) ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
        <span className="text-sm font-semibold">{value}.0</span>
        <input
          className="min-w-0 flex-1 border-none bg-transparent text-sm text-[color:var(--ep-muted)] outline-none"
          value={label}
          placeholder="标签，例如：整体体验"
          onChange={(e) => updateAttributes({ label: e.target.value })}
          onKeyDown={(e) => e.stopPropagation()}
        />
      </div>
    </NodeViewWrapper>
  );
}

/** 示例：第三方插件带来的自定义块级元素 —— 评分 */
export const Rating = Node.create({
  name: "rating",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      value: {
        default: 5,
        parseHTML: (el) => Number(el.getAttribute("data-value")) || 5,
        renderHTML: (attrs) => ({ "data-value": String(attrs.value) }),
      },
      label: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-label") || "",
        renderHTML: (attrs) => ({ "data-label": attrs.label || "" }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='rating']" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const v = Number(node.attrs.value ?? 5);
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "rating",
        class: "ep-rating",
      }),
      `${"★".repeat(v)}${"☆".repeat(Math.max(0, 5 - v))} ${node.attrs.label ?? ""}`.trim(),
    ];
  },

  addCommands() {
    return {
      setRating:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(RatingView);
  },
});
