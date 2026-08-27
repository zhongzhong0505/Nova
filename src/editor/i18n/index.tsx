import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  coreMessages,
  locales,
  type LocaleCode,
  type Messages,
} from "./locales";
import { getPlugins } from "../plugins/registry";

type Translate = (key: string, vars?: Record<string, string | number>) => string;

interface I18nValue {
  locale: LocaleCode;
  setLocale: (l: LocaleCode) => void;
  t: Translate;
  locales: typeof locales;
}

const I18nContext = createContext<I18nValue | null>(null);

function detectLocale(): LocaleCode {
  const saved = typeof localStorage !== "undefined"
    ? localStorage.getItem("nova.locale")
    : null;
  if (saved && locales.some((l) => l.code === saved)) return saved as LocaleCode;
  const nav = typeof navigator !== "undefined" ? navigator.language : "en-US";
  if (nav.startsWith("zh")) return "zh-CN";
  if (nav.startsWith("ja")) return "ja-JP";
  return "en-US";
}

function namespace(dict: Messages, ns: string): Messages {
  const out: Messages = {};
  for (const [k, v] of Object.entries(dict)) out[`${ns}.${k}`] = v;
  return out;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(detectLocale);

  const bundle = useMemo(() => {
    let out: Messages = { ...coreMessages[locale] };
    for (const p of getPlugins()) {
      const dict = p.messages?.[locale];
      if (dict) out = { ...out, ...namespace(dict, p.id) };
      const fallback = p.messages?.["en-US"];
      if (fallback) out = { ...namespace(fallback, p.id), ...out };
    }
    return out;
  }, [locale]);

  const t = useCallback<Translate>(
    (key, vars) => {
      let str = bundle[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v));
        }
      }
      return str;
    },
    [bundle],
  );

  const setLocale = useCallback((l: LocaleCode) => {
    setLocaleState(l);
    try {
      localStorage.setItem("nova.locale", l);
      document.documentElement.lang = l;
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, t, locales }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
