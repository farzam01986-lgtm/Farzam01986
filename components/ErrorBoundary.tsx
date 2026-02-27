
import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">اوه! مشکلی پیش آمد</h1>
          <p className="text-gray-600 mb-6">متأسفانه برنامه با خطا مواجه شد. لطفاً صفحه را رفرش کنید.</p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="bg-blue-500 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-blue-600 transition-colors"
          >
            ریست کردن و تلاش مجدد
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
