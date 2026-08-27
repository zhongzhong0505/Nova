import { useEffect, useMemo, useRef, useState } from "react";
import {
  Braces,
  Check,
  Copy,
  Download,
  FileCode,
  Layers,
  Loader,
  Puzzle,
  Upload,
} from "lucide-react";
import type { Editor } from "@tiptap/react";
import { useI18n } from "../editor/i18n";
import { htmlToMarkdown, looksLikeHtml, markdownToHtml } from "../editor/markdown";
import {
  ALL_PLUGIN_IDS,
  getPlugins,
  pluginStats,
} from "../editor/plugins";
import type { LocaleCode } from "../editor/i18n/locales";
import { cn } from "../utils/cn";

type Tab = "output" | "import" | "plugins";
type Format = "html" | "markdown" | "json";

interface Props {
  editor: Editor;
  enabled: string[];
  onTogglePlugin: (id: string) => void;
  onResetPlugins: () => void;
  onLoadSample: () => void;
  onImported: () => void;
}

export function SidePanel({
  editor,
  enabled,
  onTogglePlugin,
  onResetPlugins,
  onLoadSample,
  onImported,
}: Props) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("output");
  const [format, setFormat] = useState<Format>("html");
  const [copied, setCopied] = useState(false);

  // 输出面板做一次防抖，避免每次按键都跑一遍序列化
  const [snapshot, setSnapshot] = useState(() => editor.getHTML());
  useEffect(() => {
    if (tab !== "output") return;
    const id = setTimeout(() => setSnapshot(editor.getHTML()), 350);
    return () => clearTimeout(id);
  });

  const code = useMemo(() => {
    if (format === "html") return snapshot;
    if (format === "markdown") return htmlToMarkdown(snapshot);
    return JSON.stringify(editor.getJSON(), null, 2);
  }, [format, snapshot, editor]);
  const ext = format === "markdown" ? "md" : format;
  const mime =
    format === "json" ? "application/json" : format === "markdown" ? "text/markdown" : "text/html";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };

  const download = () => {
    const blob = new Blob([code], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `document.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { id: Tab; label: string; icon: typeof FileCode }[] = [
    { id: "output", label: t("tab.output"), icon: FileCode },
    { id: "import", label: t("tab.import"), icon: Upload },
    { id: "plugins", label: t("tab.plugins"), icon: Puzzle },
  ];

  return (
    <aside className="flex min-h-0 flex-col rounded-2xl border border-[color:var(--ep-border)] bg-[color:var(--ep-surface)] lg:h-[calc(100vh-7.5rem)]">
      <div className="flex items-center gap-1 border-b border-[color:var(--ep-border)] p-2">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-sm font-medium transition",
              tab === tb.id
                ? "bg-[color:var(--ep-accent-soft)] text-[color:var(--ep-accent)]"
                : "text-[color:var(--ep-muted)] hover:bg-black/5 dark:hover:bg-white/10",
            )}
          >
            <tb.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tb.label}</span>
          </button>
        ))}
      </div>

      <div className="ep-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {tab === "output" && (
          <div className="space-y-3">
            <div className="flex items-center gap-1">
              {(["html", "markdown", "json"] as Format[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium transition",
                    format === f
                      ? "bg-[color:var(--ep-text)] text-[color:var(--ep-surface)]"
                      : "text-[color:var(--ep-muted)] hover:bg-black/5 dark:hover:bg-white/10",
                  )}
                >
                  {t(`output.${f}`)}
                </button>
              ))}
              <div className="ml-auto flex gap-1">
                <button
                  onClick={copy}
                  title={t("action.copy")}
                  className="rounded-lg p-1.5 text-[color:var(--ep-muted)] hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={download}
                  title={t("action.download")}
                  className="rounded-lg p-1.5 text-[color:var(--ep-muted)] hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
            <pre className="ep-scroll max-h-[46vh] overflow-auto rounded-xl bg-[color:var(--ep-code-bg)] p-3 text-[11px] leading-relaxed lg:max-h-[calc(100vh-19rem)]">
              <code>{code}</code>
            </pre>
            <p className="text-xs text-[color:var(--ep-muted)]">
              {t("output.desc")}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onLoadSample}
                className="flex-1 rounded-xl border border-[color:var(--ep-border)] px-3 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
              >
                {t("action.loadSample")}
              </button>
            </div>
          </div>
        )}

        {tab === "import" && (
          <ImportPanel editor={editor} onImported={onImported} />
        )}

        {tab === "plugins" && (
          <PluginPanel
            enabled={enabled}
            onToggle={onTogglePlugin}
            onReset={onResetPlugins}
          />
        )}
      </div>
    </aside>
  );
}

function ImportPanel({
  editor,
  onImported,
}: {
  editor: Editor;
  onImported: () => void;
}) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const run = (raw: string, forceHtml?: boolean) => {
    if (!raw.trim()) {
      setMsg(t("import.empty"));
      return;
    }
    const isHtml = forceHtml ?? looksLikeHtml(raw);
    const html = isHtml ? raw : markdownToHtml(raw);
    if (mode === "append") {
      editor.chain().focus("end").insertContent(html).run();
    } else {
      editor.commands.setContent(html);
      editor.commands.focus("end");
    }
    setMsg(t("import.done"));
    setTimeout(() => setMsg(""), 1600);
    onImported();
  };

  const pickFile = async (file?: File | null) => {
    if (!file) return;
    const raw = await file.text();
    const forceHtml = /\.(html?|htm)$/i.test(file.name)
      ? true
      : /\.(md|markdown)$/i.test(file.name)
        ? false
        : undefined;
    setText(raw);
    run(raw, forceHtml);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-[color:var(--ep-muted)]">{t("import.desc")}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder={t("import.placeholder")}
        className="ep-scroll w-full resize-y rounded-xl border border-[color:var(--ep-border)] bg-transparent p-3 font-mono text-[11px] outline-none focus:border-[color:var(--ep-accent)]"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => run(text, false)}
          className="flex items-center gap-1.5 rounded-xl bg-[color:var(--ep-accent)] px-3 py-2 text-xs font-medium text-white"
        >
          <Layers className="h-3.5 w-3.5" />
          {t("import.asMarkdown")}
        </button>
        <button
          onClick={() => run(text, true)}
          className="flex items-center gap-1.5 rounded-xl border border-[color:var(--ep-border)] px-3 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
        >
          <Braces className="h-3.5 w-3.5" />
          {t("import.asHtml")}
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 rounded-xl border border-[color:var(--ep-border)] px-3 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
        >
          <Upload className="h-3.5 w-3.5" />
          {t("import.file")}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".md,.markdown,.html,.htm,.txt"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </div>
      <label className="flex items-center gap-3 text-xs text-[color:var(--ep-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <input
            type="radio"
            checked={mode === "replace"}
            onChange={() => setMode("replace")}
          />
          {t("import.replace")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <input
            type="radio"
            checked={mode === "append"}
            onChange={() => setMode("append")}
          />
          {t("import.append")}
        </span>
        {msg && <span className="ml-auto text-emerald-500">{msg}</span>}
      </label>

      <div className="rounded-xl border border-dashed border-[color:var(--ep-border)] p-3 text-[11px] leading-6 text-[color:var(--ep-muted)]">
        <div className="mb-1 font-semibold text-[color:var(--ep-text)]">
          Markdown / HTML 扩展语法
        </div>
        <div>
          <code>:::tip 标题</code> … <code>:::</code> → 提示块（Callout）
        </div>
        <div>
          <code>&gt; [!WARNING] 标题</code> → GitHub 告警（转为提示块）
        </div>
        <div>
          <code>@ada</code> → 提及元素 · <code>{'{{rating:4|标签}}'}</code> → 评分元素
        </div>
        <div>
          <code>- [x] 任务</code> → 任务列表 · <code>| 表头 |</code> → 表格
        </div>
      </div>
    </div>
  );
}

function PluginPanel({
  enabled,
  onToggle,
  onReset,
}: {
  enabled: string[];
  onToggle: (id: string) => void;
  onReset: () => void;
}) {
  const { t } = useI18n();
  const plugins = getPlugins();
  const onCount = plugins.filter((p) => p.core || enabled.includes(p.id)).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[color:var(--ep-muted)]">
          {t("plugins.on", { n: onCount, total: plugins.length })}
        </p>
        <button
          onClick={onReset}
          className="rounded-lg border border-[color:var(--ep-border)] px-2 py-1 text-[11px] hover:bg-black/5 dark:hover:bg-white/10"
        >
          {t("plugins.reset")}
        </button>
      </div>
      {plugins.map((p) => {
        const active = p.core || enabled.includes(p.id);
        const stats = pluginStats(p);
        return (
          <div
            key={p.id}
            className={cn(
              "rounded-xl border p-3 transition",
              active
                ? "border-[color:var(--ep-accent)]/40 bg-[color:var(--ep-accent-soft)]/40"
                : "border-[color:var(--ep-border)] opacity-70",
            )}
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{p.name}</span>
                  <span className="rounded-md bg-black/5 px-1.5 py-0.5 text-[10px] font-mono text-[color:var(--ep-muted)] dark:bg-white/10">
                    v{p.version}
                  </span>
                  {p.core && (
                    <span className="rounded-md bg-[color:var(--ep-accent)]/15 px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--ep-accent)]">
                      {t("plugins.core")}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-[color:var(--ep-muted)]">
                  {t("plugins.contrib", {
                    ext: stats.extensions,
                    bar: stats.toolbar,
                    cmd: stats.commands,
                  })}
                </p>
                <p className="mt-0.5 text-[11px] text-[color:var(--ep-muted)]">
                  {p.id} · {p.author}
                </p>
              </div>
              <button
                disabled={p.core}
                onClick={() => onToggle(p.id)}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition",
                  active ? "bg-[color:var(--ep-accent)]" : "bg-black/15 dark:bg-white/20",
                  p.core && "cursor-not-allowed opacity-50",
                )}
                aria-label={p.id}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                    active ? "left-[22px]" : "left-0.5",
                  )}
                />
              </button>
            </div>
          </div>
        );
      })}
      <p className="pt-1 text-[11px] text-[color:var(--ep-muted)]">
        {t("plugins.desc")}
      </p>
      <p className="text-[11px] text-[color:var(--ep-muted)]">
        {ALL_PLUGIN_IDS.length} plugins registered
        <Loader className="ml-1 inline h-3 w-3 animate-spin opacity-50" />
      </p>
    </div>
  );
}

export type { LocaleCode };
