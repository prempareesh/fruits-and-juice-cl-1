"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full text-center space-y-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-rose-500">
                <AlertTriangle size={48} />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 rounded-full border-4 border-white dark:border-slate-950 animate-pulse" />
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Something went wrong</h1>
              <p className="text-slate-500 font-medium">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
              {this.state.error && (
                <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl text-[10px] font-mono text-slate-400 text-left overflow-auto max-h-32">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
              >
                <RefreshCw size={20} />
                Try Again
              </button>
              <Link
                href="/admin/analytics"
                className="flex-1 px-6 py-4 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 rounded-2xl font-black shadow-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
              >
                <Home size={20} />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
