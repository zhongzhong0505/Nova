import type { ComponentType } from "react";
import type { Editor, Extensions } from "@tiptap/react";
import type { LocaleCode, Messages } from "./i18n/locales";

export type { Editor };

/** toolbar 分组（也是移动端工具条的排序依据） */
export type ToolbarGroup = "history" | "block" | "inline" | "align" | "insert";

export const TOOLBAR_GROUPS: ToolbarGroup[] = [
  "history",
  "block",
  "inline",
  "align",
  "insert",
];

export type ToolbarItemKind = "button" | "select" | "color" | "dialog";

export type IconType = ComponentType<{
  className?: string;
  strokeWidth?: number;
}>;

export interface ToolbarOption {
  value: string;
  /** definePlugin 后会被命名空间化 */
  labelKey: string;
  swatch?: string;
}

export interface ToolbarItem {
  id: string;
  titleKey: string;
  icon: IconType;
  group: ToolbarGroup;
  kind?: ToolbarItemKind;
  shortcut?: string;
  dialog?: "link" | "image";
  options?: ToolbarOption[];
  run: (editor: Editor, value?: string) => void;
  isActive?: (editor: Editor) => boolean;
  isDisabled?: (editor: Editor) => boolean;
}

/** “/” “@” 等触发字符的建议项 */
export interface SuggestionItem {
  id: string;
  titleKey: string;
  keywords?: string[];
  icon?: IconType;
  group?: string;
  run: (editor: Editor) => void;
}

export interface SuggestionProvider {
  char: string;
  getItems: (query: string) => SuggestionItem[];
}

export interface EditorPlugin {
  id: string;
  name: string;
  version: string;
  author: string;
  core: boolean;
  extensions: Extensions;
  toolbar: ToolbarItem[];
  suggestions: SuggestionProvider[];
  messages?: Partial<Record<LocaleCode, Messages>>;
}

/** 插件作者书写用的宽松输入类型，key 会被自动加上 `${id}.` 前缀 */
export interface PluginDefinition {
  id: string;
  name: string;
  version?: string;
  author?: string;
  core?: boolean;
  extensions?: Extensions;
  toolbar?: Array<
    Omit<ToolbarItem, "titleKey" | "options"> & {
      titleKey: string;
      options?: Array<Omit<ToolbarOption, "labelKey"> & { labelKey: string }>;
    }
  >;
  suggestions?: Array<
    Omit<SuggestionProvider, "getItems"> & {
      getItems: (query: string) => Array<
        Omit<SuggestionItem, "titleKey"> & { titleKey: string }
      >;
    }
  >;
  messages?: Partial<Record<LocaleCode, Messages>>;
}
