import { Component, type ReactNode } from "react";
export default class PageErrorBoundary extends Component<
  { children: ReactNode; resetKey: string },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(
    previous: Readonly<{ children: ReactNode; resetKey: string }>,
  ) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey)
      this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? (
      <section className="page-pad">
        <div role="alert" className="ui-error">
          <h2>This view couldn’t open</h2>
          <p>
            The rest of your workspace is still available. Try opening this view
            again. Reopening or reloading may lose unsaved edits in this view.
          </p>
          <button
            className="btn"
            onClick={() => this.setState({ failed: false })}
          >
            Try this view again
          </button>
          <button className="btn" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      </section>
    ) : (
      this.props.children
    );
  }
}
