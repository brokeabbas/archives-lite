import { useEffect, useRef } from "react";
export function useInfiniteRef(cb: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && cb(), { rootMargin: "300px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [cb]);
  return ref;
}
