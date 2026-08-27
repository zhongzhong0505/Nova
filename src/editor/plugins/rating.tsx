import { Star } from "lucide-react";
import { definePlugin } from "./registry";
import { Rating } from "../extensions/Rating";

/**
 * 第三方插件示例：只通过一个文件就为编辑器带来
 * 新的块级元素、工具栏按钮、“/” 命令与三语文案。
 */
export const ratingPlugin = definePlugin({
  id: "rating",
  name: "Rating (community)",
  version: "0.9.0",
  author: "Community",
  extensions: [Rating],
  toolbar: [
    {
      id: "rating",
      titleKey: "insert",
      icon: Star,
      group: "insert",
      run: (e) => (e.chain().focus() as any).setRating({ value: 5, label: "" }).run(),
    },
  ],
  suggestions: [
    {
      char: "/",
      getItems: () => [
        {
          id: "cmd.rating",
          titleKey: "cmd.rating",
          keywords: ["rating", "star", "评分"],
          icon: Star,
          group: "insert",
          run: (e) => (e.chain().focus() as any).setRating({ value: 4 }).run(),
        },
      ],
    },
  ],
  messages: {
    "zh-CN": { insert: "插入评分", "cmd.rating": "评分组件" },
    "en-US": { insert: "Insert rating", "cmd.rating": "Rating widget" },
    "ja-JP": { insert: "評価を挿入", "cmd.rating": "評価ウィジェット" },
  },
});
