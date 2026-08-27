import type { EditorPlugin, PluginDefinition } from "../types";

/**
 * 极简插件注册表。
 * 插件 = Tiptap 扩展 + 工具栏条目 + 触发式命令 + 自带多语言文案。
 */
const registry: EditorPlugin[] = [];

export function definePlugin(def: PluginDefinition): EditorPlugin {
  const ns = def.id;
  const key = (k: string) => (k.startsWith(`${ns}.`) ? k : `${ns}.${k}`);

  const plugin: EditorPlugin = {
    id: def.id,
    name: def.name,
    version: def.version ?? "1.0.0",
    author: def.author ?? "Nova Team",
    core: def.core ?? false,
    extensions: def.extensions ?? [],
    toolbar: (def.toolbar ?? []).map((item) => ({
      ...item,
      id: `${ns}:${item.id}`,
      titleKey: key(item.titleKey),
      options: item.options?.map((o) => ({ ...o, labelKey: key(o.labelKey) })),
    })),
    suggestions: (def.suggestions ?? []).map((p) => ({
      char: p.char,
      getItems: (query: string) =>
        p.getItems(query).map((i) => ({
          ...i,
          id: `${ns}:${i.id}`,
          titleKey: key(i.titleKey),
        })),
    })),
    messages: def.messages,
  };

  if (registry.some((p) => p.id === plugin.id)) {
    throw new Error(`[nova] 插件 id 重复：${plugin.id}`);
  }
  registry.push(plugin);
  return plugin;
}

export function getPlugins(): EditorPlugin[] {
  return registry;
}

export function getPlugin(id: string): EditorPlugin | undefined {
  return registry.find((p) => p.id === id);
}
