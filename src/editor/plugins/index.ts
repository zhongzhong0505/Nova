import "./history";
import "./marks";
import "./blocks";
import "./insert";
import "./table";
import "./rating";

import StarterKit from "@tiptap/starter-kit";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import type { Extensions } from "@tiptap/react";
import { getPlugins, getPlugin } from "./registry";
import type { EditorPlugin } from "../types";

export { getPlugins, getPlugin };

/** 基础包（始终加载）+ 各插件声明的扩展 */
export function buildExtensions(
  plugins: EditorPlugin[],
  placeholder: string,
): Extensions {
  return [
    StarterKit.configure({
      // 这两个扩展由各自的插件提供，避免重复注册
      link: false,
      underline: false,
      heading: { levels: [1, 2, 3, 4] },
    }),
    Placeholder.configure({ placeholder }),
    CharacterCount.configure({ limit: null }),
    ...plugins.flatMap((p) => p.extensions ?? []),
  ];
}

export const ALL_PLUGIN_IDS = getPlugins().map((p) => p.id);
export const CORE_PLUGIN_IDS = getPlugins()
  .filter((p) => p.core)
  .map((p) => p.id);

export function resolvePlugins(enabled: string[]): EditorPlugin[] {
  const set = new Set(enabled);
  return getPlugins().filter((p) => p.core || set.has(p.id));
}

export function pluginStats(p: EditorPlugin) {
  return {
    extensions: p.extensions.length,
    toolbar: p.toolbar.length,
    commands: p.suggestions.reduce((n, s) => n + s.getItems("").length, 0),
  };
}
