// 各ページで共通して使うレイアウト枠を提供するコンポーネント。
import type { ReactNode } from "react";

interface StepPageLayoutProps {
  children: ReactNode;
  spacerHeight?: string;
}

export const StepPageLayout = ({ children, spacerHeight = "60px" }: StepPageLayoutProps) => {
  return (
    <>
      {children}
      <div style={{ minHeight: spacerHeight }}></div>
    </>
  );
};
