"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AsteroidsCanvas,
  type AsteroidsHandle,
} from "@/components/games/asteroids-canvas";
import type { Game } from "@/lib/data";
import type { AsteroidsStats } from "@/lib/games/asteroids/engine";
import { useSession } from "@/lib/session";

const LIVES = 3;
const INITIAL_STATS: AsteroidsStats = { score: 0, lives: LIVES, level: 1 };

export function GamePlayer({ game }: { game: Game }) {
  const { user } = useSession();
  const isRocas = game.id === "rocas";
  const engineRef = useRef<AsteroidsHandle>(null);
  const [mockScore, setMockScore] = useState(0);
  const [stats, setStats] = useState<AsteroidsStats>(INITIAL_STATS);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [typedName, setTypedName] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // La sesión se lee tras el montaje, así que el nombre se deriva en vez de copiarse a un estado.
  const name = typedName ?? user?.name ?? "INVITADO";
  // Rocas usa los valores reales del motor; el resto de juegos sigue con el mock
  const score = isRocas ? stats.score : mockScore;
  const lives = isRocas ? stats.lives : LIVES;
  const level = isRocas ? stats.level : 1 + Math.floor(mockScore / 2500);

  useEffect(() => {
    if (isRocas || over || paused) return;
    const t = setInterval(() => setMockScore((s) => s + Math.floor(10 + Math.random() * 90)), 220);
    return () => clearInterval(t);
  }, [isRocas, over, paused]);

  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    if (isRocas) {
      if (next) engineRef.current?.pause();
      else engineRef.current?.resume();
    }
  };

  const endGame = () => {
    if (isRocas) engineRef.current?.pause();
    setOver(true);
  };

  // Tecla P o pestaña oculta. Con el modal abierto la partida no se reanuda
  const handlePauseChange = (value: boolean) => {
    if (over) {
      engineRef.current?.pause();
      return;
    }
    setPaused(value);
  };

  const handleGameOver = () => {
    setPaused(false);
    setOver(true);
  };

  const restart = () => {
    setMockScore(0);
    if (isRocas) {
      engineRef.current?.restart();
      setStats(INITIAL_STATS);
    }
    setPaused(false);
    setOver(false);
    setSaved(false);
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {name}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString("es-ES")}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">{lives > 0 ? "♥ ".repeat(lives).trim() : "—"}</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={togglePause}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button className="btn magenta" onClick={endGame}>
            FIN
          </button>
          <Link href={`/juegos/${game.id}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          {isRocas ? (
            <>
              <AsteroidsCanvas
                ref={engineRef}
                onStats={setStats}
                onGameOver={handleGameOver}
                onPauseChange={handlePauseChange}
              />
              <div className="keyboard-notice">REQUIERE TECLADO</div>
            </>
          ) : (
            <div className="game-arena">
              <div className="grid-floor"></div>
              <div className="enemy e1"></div>
              <div className="enemy e2"></div>
              <div className="enemy e3"></div>
              <div className="player-ship"></div>
            </div>
          )}
          {paused && (
            <div className="crt-content" style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}>
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    marginTop: 10,
                    letterSpacing: "0.16em",
                  }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) => setTypedName(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="TUS INICIALES"
                />
                <button className="btn yellow" onClick={() => setSaved(true)}>
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <Link href="/biblioteca" className="btn magenta">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
