import { Fragment, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { useI18n } from "../editor/i18n";
import {
  TOOLBAR_GROUPS,
  type EditorPlugin,
  type ToolbarItem,
} from "../editor/types";
import { cn } from "../utils/cn";

interface Props {
  editor: Editor;
  plugins: EditorPlugin[];
}

type DialogKind = "link" | "image";

const btn =
  "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg px-1.5 text-[color:var(--ep-muted)] transition hover:bg-black/5 hover:text-[color:var(--ep-text)] active:scale-95 dark:hover:bg-white/10 disabled:opacity-35 disabled:hover:bg-transparent";
const btnActive =
  "bg-[color:var(--ep-accent-soft)] text-[color:var(--ep-accent)] hover:bg-[color:var(--ep-accent-soft)]";
const panel =
  "ep-pop absolute left-0 top-full z-40 mt-1 min-w-[168px] overflow-hidden rounded-xl border border-[color:var(--ep-border)] bg-[color:var(--ep-surface)] p-1 shadow-xl";

export function Toolbar({ editor, plugins }: Props) {
  const { t } = useI18n();
  const items = plugins.flatMap((p) => p.toolbar);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpenId(null);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const groups = TOOLBAR_GROUPS.map((group) => ({
    group,
    items: items.filter((i) => i.group === group),
  })).filter((g) => g.items.length > 0);

  const renderItem = (item: ToolbarItem) => {
    const active = item.isActive?.(editor) ?? false;
    const disabled = item.isDisabled?.(editor) ?? false;
    const label = t(item.titleKey);
    const title = item.shortcut
      ? `${label} · ${item.shortcut.replace("Mod", "Ctrl")}`
      : label;
    const open = openId === item.id;

    const triggerClick = () => {
      if (item.kind === "dialog") setDialog(item.dialog ?? "link");
      else if (item.kind === "select" || item.kind === "color")
        setOpenId(open ? null : item.id);
      else item.run(editor);
    };

    return (
      <div key={item.id} className="relative shrink-0">
        <button
          type="button"
          title={title}
          aria-label={label}
          aria-pressed={active}
          disabled={disabled}
          onClick={triggerClick}
          className={cn(btn, active && btnActive)}
        >
          <item.icon className="h-4 w-4" />
          {(item.kind === "select" || item.kind === "color") && (
            <ChevronDown className="h-3 w-3 opacity-60" />
          )}
          {item.kind === "color" && (
            <span
              className="ml-0.5 h-2 w-2 rounded-full border border-black/10"
              style={{
                background:
                  (editor.getAttributes("textStyle").color as string) ||
                  "transparent",
              }}
            />
          )}
        </button>

        {open && item.options && (
          <div
            className={cn(
              panel,
              item.kind === "color" && "grid grid-cols-2 gap-1 min-w-[132px]",
            )}
          >
            {item.options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  item.run(editor, o.value);
                  setOpenId(null);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10",
                  item.kind === "color" && "py-1 text-xs",
                )}
              >
                {o.swatch && (
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                    style={{
                      background:
                        o.value === "default" ? "transparent" : o.swatch,
                    }}
                  />
                )}
                <span className="truncate">{t(o.labelKey)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={barRef}
      className="ep-scroll sticky top-[53px] z-20 flex items-center gap-0.5 overflow-x-auto border-b border-[color:var(--ep-border)] bg-[color:var(--ep-surface)]/95 px-2 py-1.5 backdrop-blur md:flex-wrap md:overflow-visible"
    >
      {groups.map((g, gi) => (
        <Fragment key={g.group}>
          {gi > 0 && (
            <span className="mx-1 hidden h-5 w-px shrink-0 bg-[color:var(--ep-border)] md:inline-block" />
          )}
          {g.items.map(renderItem)}
        </Fragment>
      ))}

      {dialog && (
        <InsertDialog
          kind={dialog}
          onClose={() => setDialog(null)}
          editor={editor}
        />
      )}
    </div>
  );
}

function InsertDialog({
  kind,
  editor,
  onClose,
}: {
  kind: DialogKind;
  editor: Editor;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const existingUrl =
    kind === "link"
      ? ((editor.getAttributes("link").href as string) ?? "")
      : ((editor.getAttributes("image").src as string) ?? "");
  const [url, setUrl] = useState(existingUrl);
  const [text, setText] = useState("");
  const [alt, setAlt] = useState(
    (editor.getAttributes("image").alt as string) ?? "",
  );

  const submit = () => {
    if (!url.trim()) {
      onClose();
      return;
    }
    if (kind === "link") {
      if (editor.state.selection.empty && text.trim()) {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "text",
            text: text.trim(),
            marks: [{ type: "link", attrs: { href: url.trim() } }],
          })
          .run();
      } else {
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: url.trim() })
          .run();
      }
    } else {
      editor.chain().focus().setImage({ src: url.trim(), alt }).run();
    }
    onClose();
  };

  const remove = () => {
    if (kind === "link") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().deleteSelection().run();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[color:var(--ep-border)] bg-[color:var(--ep-surface)] p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 text-sm font-semibold">
          {kind === "link" ? t("dialog.link.title") : t("dialog.image.title")}
        </h3>
        <div className="space-y-2">
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={kind === "link" ? "https://" : "https://…/image.png"}
            className="w-full rounded-lg border border-[color:var(--ep-border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[color:var(--ep-accent)]"
          />
          {kind === "link" ? (
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={t("dialog.link.text")}
              className="w-full rounded-lg border border-[color:var(--ep-border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[color:var(--ep-accent)]"
            />
          ) : (
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder={t("dialog.image.alt")}
              className="w-full rounded-lg border border-[color:var(--ep-border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[color:var(--ep-accent)]"
            />
          )}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          {existingUrl ? (
            <button
              type="button"
              onClick={remove}
              className="rounded-lg px-3 py-1.5 text-sm text-rose-500 hover:bg-rose-500/10"
            >
              {t("dialog.remove")}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[color:var(--ep-border)] px-3 py-1.5 text-sm"
            >
              {t("dialog.cancel")}
            </button>
            <button
              type="button"
              onClick={submit}
              className="rounded-lg bg-[color:var(--ep-accent)] px-3 py-1.5 text-sm font-medium text-white"
            >
              {t("dialog.confirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
