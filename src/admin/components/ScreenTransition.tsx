import { useLayoutEffect, useRef, type ReactNode } from "react";
import { fadeScreen } from "./screenMotion";

/** Keep child identity stable: changing screenKey never keys/remounts the subtree. */
export default function ScreenTransition({
  screenKey,
  children,
}: {
  screenKey: string;
  children: ReactNode;
}) {
  const node = useRef<HTMLDivElement>(null);
  const previous = useRef(screenKey);
  useLayoutEffect(() => {
    const changed = previous.current !== screenKey;
    previous.current = screenKey;
    if (!changed || !node.current) return;
    return fadeScreen(
      node.current,
      window.matchMedia("(prefers-reduced-motion: reduce)"),
    );
  }, [screenKey]);
  return (
    <div ref={node} className="mgtv-screen-transition" style={{ minWidth: 0 }}>
      {children}
    </div>
  );
}
