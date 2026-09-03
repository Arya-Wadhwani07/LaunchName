"use client";

import { useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const POINT_COUNT = 46;
const LINK_DISTANCE = 150;
const POINTER_RADIUS = 220;

/**
 * A restrained canvas network — the "agentic internet" visual metaphor
 * (domains/agents as nodes, discovery as connection) applied to the hero
 * background rather than explained in prose. Points drift on their own;
 * ones near the pointer brighten and their links thicken slightly, so it
 * reads as "aware," not as decoration. Deliberately understated: low
 * point count, low opacity, no motion at all under prefers-reduced-motion.
 */
export function NetworkBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let points: Point[] = [];
    const pointer = { x: -9999, y: -9999 };

    function resize() {
      if (!canvas || !container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      points = Array.from({ length: POINT_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
      }));
    }

    function onPointerMove(e: PointerEvent) {
      const rect = container!.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    }
    function onPointerLeave() {
      pointer.x = -9999;
      pointer.y = -9999;
    }

    function drawStatic() {
      ctx!.clearRect(0, 0, width, height);
      for (const p of points) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
        ctx!.fillStyle = "rgba(165,148,255,0.35)";
        ctx!.fill();
      }
    }

    let raf = 0;
    function tick() {
      ctx!.clearRect(0, 0, width, height);

      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i];
          const b = points[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > LINK_DISTANCE) continue;
          const nearPointer = Math.min(distToPointer(a), distToPointer(b));
          const proximityBoost = nearPointer < POINTER_RADIUS ? 1 - nearPointer / POINTER_RADIUS : 0;
          const alpha = (1 - dist / LINK_DISTANCE) * 0.12 + proximityBoost * 0.18;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.strokeStyle = `rgba(124,92,255,${alpha.toFixed(3)})`;
          ctx!.lineWidth = 1;
          ctx!.stroke();
        }
      }

      for (const p of points) {
        const d = distToPointer(p);
        const boost = d < POINTER_RADIUS ? 1 - d / POINTER_RADIUS : 0;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 1.3 + boost * 1.4, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(165,148,255,${(0.32 + boost * 0.5).toFixed(3)})`;
        ctx!.fill();
      }

      raf = requestAnimationFrame(tick);
    }

    function distToPointer(p: Point) {
      return Math.sqrt((p.x - pointer.x) ** 2 + (p.y - pointer.y) ** 2);
    }

    resize();
    if (reduceMotion) {
      drawStatic();
    } else {
      raf = requestAnimationFrame(tick);
      container.addEventListener("pointermove", onPointerMove);
      container.addEventListener("pointerleave", onPointerLeave);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    function onVisibility() {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduceMotion) raf = requestAnimationFrame(tick);
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={containerRef} className={className} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
