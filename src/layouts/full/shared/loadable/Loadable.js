import React, { Suspense, Component } from "react";
import Spinner from "../../../../views/spinner/Spinner";

const CHUNK_RELOAD_KEY = "chunk_reload_attempted";

function isChunkLoadError(error) {
  return (
    error?.message?.includes("Failed to fetch dynamically imported module") ||
    error?.message?.includes("Importing a module script failed") ||
    error?.name === "ChunkLoadError"
  );
}

class ChunkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    if (isChunkLoadError(error)) {
      return { hasError: true };
    }
    throw error;
  }

  componentDidUpdate(_, prevState) {
    if (!this.state.hasError || prevState.hasError) return;

    const alreadyRetried = sessionStorage.getItem(CHUNK_RELOAD_KEY);
    if (!alreadyRetried) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
      window.location.reload();
    }
  }

  componentDidMount() {
    // Clear the retry flag on successful mount so future navigations can retry
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  }

  render() {
    if (this.state.hasError) {
      return <Spinner />;
    }
    return this.props.children;
  }
}

const Loadable = (Component) => (props) =>
  (
    <ChunkErrorBoundary>
      <Suspense fallback={<Spinner />}>
        <Component {...props} />
      </Suspense>
    </ChunkErrorBoundary>
  );

export default Loadable;
