import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { AtSign, Image as ImageIcon, Link2, Sparkles } from "lucide-react";
import { definePlugin } from "./registry";
import { Callout } from "../extensions/Callout";
import { Mention } from "../extensions/Mention";

export const PEOPLE = [
  { id: "ada", label: "Ada Lovelace", role: "Engineer" },
  { id: "linus", label: "Linus T.", role: "Kernel" },
  { id: "nova", label: "Nova Bot", role: "Assistant" },
  { id: "ming", label: "李明", role: "Design" },
  { id: "sakura", label: "佐藤 桜", role: "PM" },
];

export const insertPlugin = definePlugin({
  id: "insert",
  name: "Insert Elements",
  version: "1.4.0",
  author: "Nova Core",
  core: true,
  extensions: [
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
    }),
    Image.configure({ allowBase64: true }),
    Mention,
    Callout,
  ],
  toolbar: [
    {
      id: "link",
      titleKey: "link",
      icon: Link2,
      group: "insert",
      kind: "dialog",
      dialog: "link",
      shortcut: "Mod+K",
      run: () => {},
      isActive: (e) => e.isActive("link"),
    },
    {
      id: "image",
      titleKey: "image",
      icon: ImageIcon,
      group: "insert",
      kind: "dialog",
      dialog: "image",
      run: () => {},
    },
    {
      id: "mention",
      titleKey: "mention",
      icon: AtSign,
      group: "insert",
      run: (e) => e.chain().focus().insertContent("@").run(),
    },
    {
      id: "callout",
      titleKey: "callout",
      icon: Sparkles,
      group: "insert",
      run: (e) => (e.chain().focus() as any).toggleCallout({ type: "info" }).run(),
      isActive: (e) => e.isActive("callout"),
    },
  ],
  suggestions: [
    {
      char: "/",
      getItems: () => [
        {
          id: "cmd.callout",
          titleKey: "cmd.callout",
          keywords: ["callout", "admonition", "提示", "标注"],
          icon: Sparkles,
          group: "insert",
          run: (e) =>
            (e.chain().focus() as any).setCallout({ type: "info" }).run(),
        },
        {
          id: "cmd.image",
          titleKey: "cmd.image",
          keywords: ["image", "picture", "图片"],
          icon: ImageIcon,
          group: "insert",
          run: (e) => {
            const url = window.prompt("Image URL");
            if (url) e.chain().focus().setImage({ src: url }).run();
          },
        },
      ],
    },
    {
      char: "@",
      getItems: (query) =>
        PEOPLE.filter(
          (p) =>
            !query ||
            p.label.toLowerCase().includes(query.toLowerCase()) ||
            p.id.toLowerCase().includes(query.toLowerCase()),
        ).map((p) => ({
          id: `mention.${p.id}`,
          titleKey: `people.${p.id}`,
          keywords: [p.id, p.role],
          icon: AtSign,
          group: "mention",
          run: (e) =>
            (e.chain().focus() as any).insertMention({
              id: p.id,
              label: p.label,
            }).run(),
        })),
    },
  ],
  messages: {
    "zh-CN": {
      link: "链接",
      image: "图片",
      mention: "提及",
      callout: "提示块",
      "cmd.callout": "提示块（Callout）",
      "cmd.image": "图片",
      "people.ada": "Ada Lovelace",
      "people.linus": "Linus T.",
      "people.nova": "Nova Bot",
      "people.ming": "李明",
      "people.sakura": "佐藤 桜",
    },
    "en-US": {
      link: "Link",
      image: "Image",
      mention: "Mention",
      callout: "Callout",
      "cmd.callout": "Callout block",
      "cmd.image": "Image",
      "people.ada": "Ada Lovelace",
      "people.linus": "Linus T.",
      "people.nova": "Nova Bot",
      "people.ming": "Li Ming",
      "people.sakura": "Sato Sakura",
    },
    "ja-JP": {
      link: "リンク",
      image: "画像",
      mention: "メンション",
      callout: "コールアウト",
      "cmd.callout": "コールアウト",
      "cmd.image": "画像",
      "people.ada": "Ada Lovelace",
      "people.linus": "Linus T.",
      "people.nova": "Nova Bot",
      "people.ming": "李明",
      "people.sakura": "佐藤 桜",
    },
  },
});
