import { Redo2, Undo2 } from "lucide-react";
import { definePlugin } from "./registry";

export const historyPlugin = definePlugin({
  id: "history",
  name: "History",
  version: "1.2.0",
  author: "Nova Core",
  core: true,
  toolbar: [
    {
      id: "undo",
      titleKey: "undo",
      icon: Undo2,
      group: "history",
      shortcut: "Mod+Z",
      run: (e) => e.chain().focus().undo().run(),
      isDisabled: (e) => !e.can().undo(),
    },
    {
      id: "redo",
      titleKey: "redo",
      icon: Redo2,
      group: "history",
      shortcut: "Mod+Shift+Z",
      run: (e) => e.chain().focus().redo().run(),
      isDisabled: (e) => !e.can().redo(),
    },
  ],
  messages: {
    "zh-CN": { undo: "撤销", redo: "重做" },
    "en-US": { undo: "Undo", redo: "Redo" },
    "ja-JP": { undo: "元に戻す", redo: "やり直す" },
  },
});
