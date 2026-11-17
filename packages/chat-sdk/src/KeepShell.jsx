import { Component } from "react";

/** Keeps the rest of Clay on screen when one region throws. */
export class KeepShell extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <aside className="clay-preview" aria-label="Live preview">
          <div className="clay-preview-empty">This part stopped. The rest of Clay is fine.</div>
        </aside>
      );
    }
    return this.props.children;
  }
}
