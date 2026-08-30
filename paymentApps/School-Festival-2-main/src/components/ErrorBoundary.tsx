// 想定外の例外(バックエンドが想定外の形のデータを返した場合等)で画面全体が
// 白画面になるのを防ぐためのフォールバックUI。
// Reactのエラーバウンダリはクラスコンポーネントでのみ実装できる(フック非対応)。
import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary: 想定外のエラーを捕捉しました", error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={containerStyle}>
          <p style={titleStyle}>エラーが発生しました</p>
          <p style={messageStyle}>
            お手数ですが、再読み込みをお試しください。解決しない場合は店舗スタッフへお声がけください。
          </p>
          <button style={buttonStyle} onClick={this.handleReload}>
            再読み込み
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const containerStyle = {
  padding: "40px 20px",
  textAlign: "center" as const,
};

const titleStyle = {
  fontSize: "20px",
  fontWeight: "bold" as const,
  color: "#c0392b",
  margin: "8px 0",
};

const messageStyle = {
  fontSize: "14px",
  color: "#666",
  margin: "8px 0 20px 0",
};

const buttonStyle = {
  padding: "10px 24px",
  fontSize: "16px",
  fontWeight: "bold" as const,
  borderRadius: "8px",
  border: "2px solid #222",
  backgroundColor: "#fff",
  cursor: "pointer",
};
