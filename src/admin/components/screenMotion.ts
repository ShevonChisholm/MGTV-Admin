/** Route-only presentation. No delayed navigation, old-page snapshots or remounts. */
export function fadeScreen(
  element: HTMLElement,
  motion: MediaQueryList,
): () => void {
  if (motion.matches || typeof element.animate !== "function") return () => {};
  const animation = element.animate([{ opacity: 0.94 }, { opacity: 1 }], {
    duration: 160,
    easing: "ease-out",
  });
  const reduce = () => {
    if (motion.matches) animation.cancel();
  };
  motion.addEventListener("change", reduce);
  return () => {
    motion.removeEventListener("change", reduce);
    animation.cancel();
  };
}
