import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useI18n } from "../editor/i18n";
import type { EditorPlugin, SuggestionItem } from "../editor/types";
import { cn } from "../utils/cn";

interface SuggestionState {
  items: SuggestionItem[];
  index: number;
  from: number;
  to: number;
  left: number;
  top: number;
}

const MENU_W = 288;
const MENU_H = 300;

export function SuggestionMenu({
  editor,
  plugins,
}: {
  editor: Editor;
  plugins: EditorPlugin[];
}) {
  const { t } = useI18n();
  const [state, setState] = useState<SuggestionState | null>(null);
  const stateRef = useRef<SuggestionState | null>(null);
  stateRef.current = state;
  const dismissedRef = useRef<number | null>(null);

  const compute = useCallback((): SuggestionState | null => {
    const { state: pm, view } = editor;
    const { $from, empty } = pm.selection;
    if (!empty || !editor.isEditable) return null;

    const providers = plugins.flatMap((p) => p.suggestions);
    const textBefore = $from.parent.textBetween(
      Math.max(0, $from.parentOffset - 48),
      $from.parentOffset,
      undefined,
      "\ufffc",
    );

    for (const provider of providers) {
      const idx = textBefore.lastIndexOf(provider.char);
      if (idx === -1) continue;
      const prev = idx === 0 ? "" : textBefore[idx - 1];
      if (prev && !/[\s\u00a0(（【>》]/.test(prev)) continue;
      const query = textBefore.slice(idx + 1);
      if (/[\s\u00a0]/.test(query) || query.length > 24) continue;

      const q = query.toLowerCase();
      const items = provider
        .getItems(query)
        .filter((item) => {
          if (!q) return true;
          const title = t(item.titleKey).toLowerCase();
          const id = item.id.toLowerCase();
          const kw = (item.keywords ?? []).join(" ").toLowerCase();
          return title.includes(q) || id.includes(q) || kw.includes(q);
        });
      if (!items.length) continue;

      const from = $from.pos - (query.length + 1);
      if (dismissedRef.current === from) return null;

      const start = view.coordsAtPos(from);
      const left = Math.max(
        8,
        Math.min(start.left, window.innerWidth - MENU_W - 12),
      );
      let top = start.bottom + 8;
      if (top + MENU_H > window.innerHeight) {
        top = Math.max(8, start.top - MENU_H - 8);
      }
      return { items, index: 0, from, to: $from.pos, left, top };
    }
    return null;
  }, [editor, plugins, t]);

  useEffect(() => {
    const update = () => setState(compute());
    update();
    editor.on("update", update);
    editor.on("selectionUpdate", update);
    return () => {
      editor.off("update", update);
      editor.off("selectionUpdate", update);
    };
  }, [editor, compute]);

  const choose = useCallback(
    (s: SuggestionState, index = s.index) => {
      const item = s.items[index];
      if (!item) return;
      editor.chain().focus().deleteRange({ from: s.from, to: s.to }).run();
      item.run(editor);
      setState(null);
    },
    [editor],
  );

  useEffect(() => {
    const dom = editor.view.dom;
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s || !s.items.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setState({ ...s, index: (s.index + 1) % s.items.length });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setState({
          ...s,
          index: (s.index - 1 + s.items.length) % s.items.length,
        });
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        choose(s);
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        dismissedRef.current = s.from;
        setState(null);
      }
    };
    dom.addEventListener("keydown", onKey, true);
    return () => dom.removeEventListener("keydown", onKey, true);
  }, [editor, choose]);

  if (!state) return null;

  return (
    <div
      className="ep-pop fixed z-50 overflow-hidden rounded-2xl border border-[color:var(--ep-border)] bg-[color:var(--ep-surface)] shadow-2xl"
      style={{ left: state.left, top: state.top, width: MENU_W }}
    >
      <div className="ep-scroll max-h-[248px] overflow-y-auto p-1">
        {state.items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onMouseEnter={() => setState({ ...state, index: i })}
            onMouseDown={(e) => {
              e.preventDefault();
              choose(state, i);
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm",
              i === state.index
                ? "bg-[color:var(--ep-accent-soft)] text-[color:var(--ep-accent)]"
                : "hover:bg-black/5 dark:hover:bg-white/10",
            )}
          >
            {item.icon && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[color:var(--ep-border)] bg-[color:var(--ep-surface-2)]">
                <item.icon className="h-4 w-4" />
              </span>
            )}
            <span className="truncate font-medium">{t(item.titleKey)}</span>
            {item.group && (
              <span className="ml-auto text-[10px] uppercase tracking-wide text-[color:var(--ep-muted)]">
                {item.group}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="border-t border-[color:var(--ep-border)] px-3 py-1.5 text-[11px] text-[color:var(--ep-muted)]">
        {t("suggest.hint")}
      </div>
    </div>
  );
}
