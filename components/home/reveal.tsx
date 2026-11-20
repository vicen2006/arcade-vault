"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface RevealProps {
  as?: "section" | "div";
  className?: string;
  children: ReactNode;
}

export function Reveal({ as: Tag = "section", className = "", children }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref as never} className={`${className} reveal`.trim()}>
      {children}
    </Tag>
  );
}
