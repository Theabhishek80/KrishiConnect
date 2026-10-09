import React from "react";

/*
 * Catches any error thrown while rendering a page, so one broken
 * component shows a friendly message instead of a blank white screen.
 * It resets automatically when the user navigates to another route
 * (see `resetKey`), and offers a reload button otherwise.
 */
export default class ErrorBoundary extends React.Component {

  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("UI crashed:", error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    // Navigating to another page clears the error automatically.
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {

    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <section
        className="page-section"
        style={{ textAlign: "center", padding: "60px 20px" }}
      >
        <h2>Something went wrong on this page</h2>

        <p style={{ margin: "12px 0 24px" }}>
          Your data is safe. Please reload the page and try again.
        </p>

        <button
          className="primary-btn"
          onClick={() => window.location.reload()}
        >
          Reload page
        </button>
      </section>
    );
  }
}
