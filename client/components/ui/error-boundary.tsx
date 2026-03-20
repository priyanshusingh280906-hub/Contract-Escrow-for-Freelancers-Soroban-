"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#050510",
            color: "#f87171",
            fontFamily: "monospace",
            fontSize: "14px",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div>
            <p style={{ fontWeight: "bold", marginBottom: "8px" }}>Something went wrong</p>
            <p style={{ color: "#ffffff55", fontSize: "12px" }}>
              {this.state.error?.message ?? "Unknown error"}
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
