import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import { Columns3, Rows3, Table as TableIcon, Trash2 } from "lucide-react";
import { definePlugin } from "./registry";

export const tablePlugin = definePlugin({
  id: "table",
  name: "Table",
  version: "1.1.0",
  author: "Nova Core",
  extensions: [
    Table.configure({ resizable: true, lastColumnResizable: false }),
    TableRow,
    TableHeader,
    TableCell,
  ],
  toolbar: [
    {
      id: "insertTable",
      titleKey: "insert",
      icon: TableIcon,
      group: "insert",
      run: (e) =>
        e
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
    {
      id: "addRow",
      titleKey: "addRow",
      icon: Rows3,
      group: "insert",
      run: (e) => e.chain().focus().addRowAfter().run(),
      isDisabled: (e) => !e.can().addRowAfter(),
    },
    {
      id: "addCol",
      titleKey: "addCol",
      icon: Columns3,
      group: "insert",
      run: (e) => e.chain().focus().addColumnAfter().run(),
      isDisabled: (e) => !e.can().addColumnAfter(),
    },
    {
      id: "delTable",
      titleKey: "delete",
      icon: Trash2,
      group: "insert",
      run: (e) => e.chain().focus().deleteTable().run(),
      isDisabled: (e) => !e.can().deleteTable(),
    },
  ],
  suggestions: [
    {
      char: "/",
      getItems: () => [
        {
          id: "cmd.table",
          titleKey: "cmd.table",
          keywords: ["table", "表格", "grid"],
          icon: TableIcon,
          group: "insert",
          run: (e) =>
            e
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run(),
        },
      ],
    },
  ],
  messages: {
    "zh-CN": {
      insert: "插入表格",
      addRow: "在下方插入行",
      addCol: "在右侧插入列",
      delete: "删除表格",
      "cmd.table": "表格",
    },
    "en-US": {
      insert: "Insert table",
      addRow: "Insert row below",
      addCol: "Insert column right",
      delete: "Delete table",
      "cmd.table": "Table",
    },
    "ja-JP": {
      insert: "表を挿入",
      addRow: "下に行を追加",
      addCol: "右に列を追加",
      delete: "表を削除",
      "cmd.table": "表",
    },
  },
});
