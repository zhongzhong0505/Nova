import { Mark, mergeAttributes } from "@tiptap/core";

/** 自定义行内 mark：剧透（hover 显示） */
export const Spoiler = Mark.create({
  name: "spoiler",
  inclusive: false,
  excludes: "",

  parseHTML() {
    return [{ tag: "span[data-spoiler]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-spoiler": "true",
        class: "ep-spoiler",
        title: "Spoiler",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      toggleSpoiler:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
    };
  },
});
