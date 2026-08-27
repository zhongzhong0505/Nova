import { marked } from "marked";
import TurndownService from "turndown";

const esc = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** 只在代码块之外做替换，避免误伤代码内容 */
function outsideCode(src: string, fn: (s: string) => string): string {
  return src
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((part) =>
      part.startsWith("```") || /^`[^`]*`$/.test(part) ? part : fn(part),
    )
    .join("");
}

/**
 * Markdown → HTML
 * 在 marked 之前做一层“自定义语法”预处理，让私有元素（callout / mention / rating）
 * 也能从 Markdown 还原成编辑器结构。
 */
export function markdownToHtml(md: string): string {
  let src = md ?? "";

  // 1) :::type Title ... :::  自定义提示块
  src = src.replace(
    /^:::(\w+)[ \t]*([^\n]*)\n([\s\S]*?)^:::[ \t]*$/gm,
    (_m, type: string, title: string, body: string) => {
      const inner = body
        .trim()
        .split(/\n{2,}/)
        .map((p) => `<p>${p.trim().replace(/\n/g, "<br>")}</p>`)
        .join("");
      return `<div data-type="callout" data-callout-type="${type}" data-title="${esc(
        (title || "").trim(),
      )}">${inner}</div>`;
    },
  );

  // 2) GitHub 风格告警  > [!NOTE] 标题
  src = src.replace(
    /^> \[!(\w+)\][ \t]*([^\n]*)\n((?:>[^\n]*\n?)*)/gm,
    (_m, type: string, title: string, rest: string) => {
      const body = rest
        .split("\n")
        .map((l) => l.replace(/^>\s?/, ""))
        .filter((l) => l.trim().length > 0)
        .join("\n");
      const inner = body
        .split(/\n{2,}/)
        .map((p) => `<p>${p.trim().replace(/\n/g, "<br>")}</p>`)
        .join("");
      return `<div data-type="callout" data-callout-type="${type.toLowerCase()}" data-title="${esc(
        (title || "").trim(),
      )}">${inner}</div>`;
    },
  );

  src = outsideCode(src, (s) => {
    // 3) {{rating:4|标签}} 评分元素
    let out = s.replace(
      /\{\{\s*rating\s*:\s*(\d)\s*(?:\|\s*([^}]*))?\}\}/g,
      (_m, v: string, label: string) =>
        `<div data-type="rating" data-value="${v}" data-label="${esc(
          (label || "").trim(),
        )}"></div>`,
    );
    // 4) @mention
    out = out.replace(
      /(^|[^\w@/`])@([A-Za-z0-9_\u4e00-\u9fa5\u3040-\u30ff]{1,24})/g,
      (_m, pre: string, id: string) =>
        `${pre}<span data-type="mention" data-id="${id}" data-label="${id}"></span>`,
    );
    return out;
  });

  const html = marked.parse(src, {
    async: false,
    gfm: true,
    breaks: false,
  }) as string;

  return normalizeTaskLists(html);
}

/** marked 输出的是普通 checkbox，这里转换成 Tiptap TaskList 结构 */
function normalizeTaskLists(html: string): string {
  return html.replace(
    /(?:<li>\s*<input[^>]*type="checkbox"[^>]*>[\s\S]*?<\/li>\s*)+/g,
    (block) => {
      const items = block.match(/<li>[\s\S]*?<\/li>/g) ?? [];
      const lis = items
        .map((li) => {
          const checked = /<input[^>]*\bchecked\b[^>]*>/i.test(li);
          const content = li
            .replace(/^\s*<li>/, "")
            .replace(/<\/li>\s*$/, "")
            .replace(/<input[^>]*>/i, "")
            .trim();
          return `<li data-type="taskItem" data-checked="${checked}"><div>${content}</div></li>`;
        })
        .join("");
      return `<ul data-type="taskList">${lis}</ul>`;
    },
  );
}

/**
 * HTML → Markdown
 * 通过 turndown 规则把自定义元素序列化回 Markdown 语法。
 */
export function htmlToMarkdown(html: string): string {
  const td = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
  });

  td.keep(["u", "mark", "sub", "sup"]);

  td.addRule("callout", {
    filter: (node) =>
      node.nodeName === "DIV" && node.getAttribute("data-type") === "callout",
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const type = (el.getAttribute("data-callout-type") || "info").toUpperCase();
      const title = el.getAttribute("data-title") || "";
      const body = (_content || "").trim();
      const lines = body
        .split("\n")
        .map((l) => `> ${l}`.trimEnd())
        .join("\n");
      return `\n\n> [!${type}]${title ? " " + title : ""}\n${lines}\n\n`;
    },
  });

  td.addRule("mention", {
    filter: (node) =>
      node.nodeName === "SPAN" && node.getAttribute("data-type") === "mention",
    replacement: (_c, node) => `@${(node as HTMLElement).getAttribute("data-id") ?? ""}`,
  });

  td.addRule("rating", {
    filter: (node) =>
      node.nodeName === "DIV" && node.getAttribute("data-type") === "rating",
    replacement: (_c, node) => {
      const el = node as HTMLElement;
      const v = el.getAttribute("data-value") || "5";
      const label = el.getAttribute("data-label") || "";
      return `\n\n{{rating:${v}${label ? `|${label}` : ""}}}\n\n`;
    },
  });

  td.addRule("spoiler", {
    filter: (node) =>
      node.nodeName === "SPAN" && node.hasAttribute("data-spoiler"),
    replacement: (content) => `<span data-spoiler="true">${content}</span>`,
  });

  td.addRule("strikethrough", {
    filter: ["del", "s"],
    replacement: (content) => `~~${content}~~`,
  });

  td.addRule("table", {
    filter: "table",
    replacement: (_c, node) => {
      const table = node as HTMLTableElement;
      const rows = Array.from(table.rows).map((row) =>
        Array.from(row.cells).map((cell) =>
          td.turndown(cell.innerHTML).replace(/\n+/g, " ").trim(),
        ),
      );
      if (!rows.length) return "";
      const [head, ...body] = rows;
      const sep = head.map(() => " --- ");
      const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
      return `\n\n${line(head)}\n|${sep.join("|")}|\n${body
        .map(line)
        .join("\n")}\n\n`;
    },
  });

  return td.turndown(html ?? "").trim();
}

/** 判断一段文本更像 HTML 还是 Markdown */
export function looksLikeHtml(text: string): boolean {
  return /^\s*<(?:p|h[1-6]|div|ul|ol|table|blockquote|figure|pre|section|article)[\s>]/i.test(
    text ?? "",
  );
}
