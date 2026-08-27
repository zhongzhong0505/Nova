import { Node, mergeAttributes } from "@tiptap/core";

export interface MentionAttrs {
  id: string;
  label: string;
}

/** 自定义行内原子元素：@提及 */
export const Mention = Node.create({
  name: "mention",
  inline: true,
  group: "inline",
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      id: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-id") || "",
        renderHTML: (attrs) => ({ "data-id": attrs.id }),
      },
      label: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-label") || "",
        renderHTML: (attrs) => ({ "data-label": attrs.label || attrs.id }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-type='mention']" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": "mention",
        class: "ep-mention",
      }),
      `@${node.attrs.label || node.attrs.id}`,
    ];
  },

  renderText({ node }) {
    return `@${node.attrs.label || node.attrs.id}`;
  },

  addCommands() {
    return {
      insertMention:
        (attrs: MentionAttrs) =>
        ({ commands }) =>
          commands.insertContent([
            { type: this.name, attrs },
            { type: "text", text: " " },
          ]),
    };
  },
});
