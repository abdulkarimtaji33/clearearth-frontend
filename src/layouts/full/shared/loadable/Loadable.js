import React, { Suspense, Component, lazy } from "react";
import Spinner from "../../../../views/spinner/Spinner";
import { clearChunkReloadFlag, handleChunkLoadError, isChunkLoadError } from "../../../../utils/chunkReload";

export function lazyWithChunkReload(importFn) {
  return lazy(() =>
    importFn().catch((error) => {
      if (handleChunkLoadError(error)) {
        return new Promise(() => {});
      }
      throw error;
    })
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
    handleChunkLoadError(new Error('chunk load failed'));
  }

  componentDidMount() {
    clearChunkReloadFlag();
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
