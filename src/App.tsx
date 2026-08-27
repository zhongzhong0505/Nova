import { I18nProvider } from "./editor/i18n";
import { EditorWorkbench } from "./components/EditorWorkbench";

export default function App() {
  return (
    <I18nProvider>
      <EditorWorkbench />
    </I18nProvider>
  );
}
