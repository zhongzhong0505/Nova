import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Languages, Moon, Sparkles, Sun } from "lucide-react";
import { useI18n } from "../editor/i18n";
import { markdownToHtml } from "../editor/markdown";
import { getSample } from "../editor/samples";
import {
  ALL_PLUGIN_IDS,
  buildExtensions,
  resolvePlugins,
} from "../editor/plugins";
import type { LocaleCode } from "../editor/i18n/locales";
import { Toolbar } from "./Toolbar";
import { SuggestionMenu } from "./SuggestionMenu";
import { SidePanel } from "./SidePanel";
import { cn } from "../utils/cn";

function loadEnabled(): string[] {
  try {
    const raw = localStorage.getItem("nova.plugins");
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      return ALL_PLUGIN_IDS.filter((id) => parsed.includes(id));
    }
  } catch {
    /* ignore */
  }
  return [...ALL_PLUGIN_IDS];
}

export function EditorWorkbench() {
  const { t, locale, setLocale, locales } = useI18n();
  const [enabled, setEnabled] = useState<string[]>(loadEnabled);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      return localStorage.getItem("nova.theme") === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });
  const [saved, setSaved] = useState(true);

  const initialRef = useRef<string | null>(null);
  if (!initialRef.current) initialRef.current = markdownToHtml(getSample(locale));
  const htmlRef = useRef<string>(initialRef.current);

  const plugins = useMemo(() => resolvePlugins(enabled), [enabled]);

  const editor = useEditor(
    {
      extensions: buildExtensions(plugins, t("editor.placeholder")),
      content: htmlRef.current,
      autofocus: false,
      shouldRerenderOnTransaction: true,
      editorProps: {
        attributes: {
          class: "outline-none",
          spellcheck: "false",
        },
      },
      onUpdate: ({ editor: ed }) => {
        htmlRef.current = ed.getHTML();
        setSaved(false);
      },
    },
    [plugins, locale],
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem("nova.theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    if (saved) return;
    const id = setTimeout(() => setSaved(true), 1200);
    return () => clearTimeout(id);
  }, [saved]);

  const togglePlugin = useCallback(
    (id: string) => {
      if (editor) htmlRef.current = editor.getHTML();
      setEnabled((prev) => {
        const next = prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id];
        try {
          localStorage.setItem("nova.plugins", JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [editor],
  );

  const resetPlugins = useCallback(() => {
    if (editor) htmlRef.current = editor.getHTML();
    setEnabled([...ALL_PLUGIN_IDS]);
  }, [editor]);

  const loadSample = useCallback(() => {
    editor?.commands.setContent(markdownToHtml(getSample(locale)));
  }, [editor, locale]);

  const onImported = useCallback(() => {
    if (editor) htmlRef.current = editor.getHTML();
    setSaved(false);
  }, [editor]);

  const words = editor?.storage.characterCount.words() ?? 0;
  const chars = editor?.storage.characterCount.characters() ?? 0;
  const minutes = Math.max(1, Math.round(words / 220));

  return (
    <div className="min-h-screen bg-[color:var(--ep-surface-2)] text-[color:var(--ep-text)]">
      <header className="sticky top-0 z-30 border-b border-[color:var(--ep-border)] bg-[color:var(--ep-surface)]/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-3 py-2.5 sm:px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-bold leading-tight">
              {t("app.name")}
            </h1>
            <p className="hidden truncate text-xs text-[color:var(--ep-muted)] sm:block">
              {t("app.tagline")}
            </p>
          </div>

          <span className="hidden rounded-full border border-[color:var(--ep-border)] px-2.5 py-1 text-[11px] text-[color:var(--ep-muted)] md:inline-block">
            {t("app.badge")}
          </span>

          <div className="flex items-center gap-1.5">
            <div className="relative hidden items-center sm:flex">
              <Languages className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-[color:var(--ep-muted)]" />
              <select
                aria-label={t("lang.label")}
                value={locale}
                onChange={(e) => setLocale(e.target.value as LocaleCode)}
                className="appearance-none rounded-lg border border-[color:var(--ep-border)] bg-transparent py-1.5 pl-7 pr-2 text-xs outline-none"
              >
                {locales.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? t("theme.toLight") : t("theme.toDark")}
              className="rounded-lg border border-[color:var(--ep-border)] p-2 text-[color:var(--ep-muted)] hover:bg-black/5 dark:hover:bg-white/10"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <select
              aria-label={t("lang.label")}
              value={locale}
              onChange={(e) => setLocale(e.target.value as LocaleCode)}
              className="rounded-lg border border-[color:var(--ep-border)] bg-transparent px-1.5 py-2 text-xs outline-none sm:hidden"
            >
              {locales.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.short}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1400px] gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-cols-[minmax(0,1fr)_370px]">
        <section className="flex min-w-0 flex-col rounded-2xl border border-[color:var(--ep-border)] bg-[color:var(--ep-surface)] shadow-sm">
          {editor && <Toolbar editor={editor} plugins={plugins} />}
          <div
            className="ep-editor ep-scroll flex-1 px-4 py-5 sm:px-8 sm:py-7"
            onClick={(e) => {
              if (e.target === e.currentTarget) editor?.commands.focus("end");
            }}
          >
            <EditorContent editor={editor} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[color:var(--ep-border)] px-4 py-2 text-[11px] text-[color:var(--ep-muted)]">
            <span>
              {words} {t("status.words")}
            </span>
            <span>
              {chars} {t("status.chars")}
            </span>
            <span>{t("status.read", { min: minutes })}</span>
            <span
              className={cn(
                "ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-0.5",
                saved
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-amber-500/10 text-amber-500",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  saved ? "bg-emerald-500" : "bg-amber-500",
                )}
              />
              {saved ? t("status.saved") : t("status.saving")}
            </span>
          </div>
        </section>

        {editor && (
          <SidePanel
            editor={editor}
            enabled={enabled}
            onTogglePlugin={togglePlugin}
            onResetPlugins={resetPlugins}
            onLoadSample={loadSample}
            onImported={onImported}
          />
        )}
      </main>

      {editor && <SuggestionMenu editor={editor} plugins={plugins} />}

      <footer className="mx-auto max-w-[1400px] px-4 pb-8 pt-1 text-center text-[11px] text-[color:var(--ep-muted)]">
        {t("app.name")} · Tiptap / ProseMirror · {plugins.length} plugins
        active
      </footer>
    </div>
  );
}
