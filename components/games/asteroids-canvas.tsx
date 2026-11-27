"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { H, W } from "@/lib/games/asteroids/constants";
import {
  createAsteroidsEngine,
  type AsteroidsCallbacks,
  type AsteroidsEngine,
} from "@/lib/games/asteroids/engine";

// Controles que el padre puede usar sobre el motor
export interface AsteroidsHandle {
  pause(): void;
  resume(): void;
  restart(): void;
}

interface AsteroidsCanvasProps extends AsteroidsCallbacks {
  ref?: Ref<AsteroidsHandle>;
}

export function AsteroidsCanvas({
  ref,
  onStats,
  onGameOver,
  onPauseChange,
}: AsteroidsCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AsteroidsEngine | null>(null);
  const callbacksRef = useRef<AsteroidsCallbacks>({
    onStats,
    onGameOver,
    onPauseChange,
  });

  // El motor se crea una sola vez; siempre llama a los callbacks más recientes
  useEffect(() => {
    callbacksRef.current = { onStats, onGameOver, onPauseChange };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createAsteroidsEngine(canvas, {
      onStats: (stats) => callbacksRef.current.onStats(stats),
      onGameOver: (score) => callbacksRef.current.onGameOver(score),
      onPauseChange: (paused) => callbacksRef.current.onPauseChange(paused),
    });
    engineRef.current = engine;
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    pause: () => engineRef.current?.pause(),
    resume: () => engineRef.current?.resume(),
    restart: () => engineRef.current?.restart(),
  }));

  return (
    <canvas
      ref={canvasRef}
      className="asteroids-canvas"
      width={W}
      height={H}
      aria-label="Juego ROCAS"
    />
  );
}
