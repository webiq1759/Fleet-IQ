import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public readonly props: Readonly<Props>;

    public state: State = {
        hasError: false,
        error: null
    };

    constructor(props: Props) {
        super(props);
        this.props = props;
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 z-[9999]">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border border-slate-100 dark:border-slate-800">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Oops, something went wrong.</h1>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
                            The app encountered an unexpected error. Please try resetting the application session to fix this.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    localStorage.clear();
                                    sessionStorage.clear();
                                    window.location.href = '/';
                                }}
                                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
                            >
                                Reset Application
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors"
                            >
                                Try Reloading
                            </button>
                        </div>

                        <details className="mt-8 text-xs text-left" style={{ display: 'none' }}>
                            <summary className="text-slate-400 cursor-pointer hover:text-slate-600">View exact error details</summary>
                            <pre className="mt-2 p-3 bg-slate-100 dark:bg-slate-950 rounded text-slate-600 overflow-auto">
                                {this.state.error?.toString()}
                            </pre>
                        </details>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
