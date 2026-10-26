// アプリ全体の共通レイアウトをまとめるルートコンポーネント。
// 状態は AppProvider(context/)が持ち、画面の切り替えは AppScreenRenderer のルーティングで行う。
import "./styles.css";

import { Header } from "./components/Header";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppScreenRenderer } from "./AppScreenRenderer";
import { LegalNoticePage } from "./pages/LegalNoticePage";
import { AppProvider } from "./context/AppProvider";
import { useAppContext } from "./context/AppContext";

const LegalNotice = () => {
  const { isLegalNoticeOpen, closeLegalNotice } = useAppContext();
  return isLegalNoticeOpen ? <LegalNoticePage onClose={closeLegalNotice} /> : null;
};

export const App = () => {
  return (
    <AppProvider>
      <style>{`\n        @keyframes cm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }\n      `}</style>

      <header>
        <Header />
        <div style={{ minHeight: "10px" }}></div>
      </header>

      <ErrorBoundary>
        <AppScreenRenderer />
      </ErrorBoundary>

      <LegalNotice />
    </AppProvider>
  );
};
