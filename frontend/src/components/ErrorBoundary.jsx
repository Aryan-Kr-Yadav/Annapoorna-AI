import { Component } from "react";
import { AlertTriangle } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("KrishiMitra AI crashed:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center dark:bg-gray-950">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/30">
            <AlertTriangle size={28} />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            Something went wrong
          </h1>
          <p className="max-w-md text-gray-500 dark:text-gray-400">
            We hit an unexpected error. Please try reloading the page — your data is safe.
          </p>
          <button onClick={this.handleReset} className="btn-primary">
            Back to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
