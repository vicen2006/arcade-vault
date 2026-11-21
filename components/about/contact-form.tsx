"use client";

import { useState, useTransition, type FormEvent } from "react";
import { sendContact } from "@/app/acerca/actions";
import { CONTACT_LIMITS, validateContact } from "@/lib/contact";

const EMPTY = { name: "", email: "", msg: "" };

export function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [sent, setSent] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    if (!validateContact(form)) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setError(false);
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await sendContact(data);
      if (result.ok) setSent(result.name);
      else setError(true);
    });
  };

  const reset = () => {
    setSent(null);
    setError(false);
    setForm(EMPTY);
  };

  return (
    <form
      className={"contact-form" + (shake ? " shake" : "")}
      onSubmit={onSubmit}
      noValidate
    >
      {sent === null ? (
        <>
          <div className="field">
            <label htmlFor="contact-name">NOMBRE</label>
            <input
              id="contact-name"
              name="name"
              value={form.name}
              maxLength={CONTACT_LIMITS.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="px_kai"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              value={form.email}
              maxLength={CONTACT_LIMITS.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jugador@vault.gg"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-msg">MENSAJE</label>
            <textarea
              id="contact-msg"
              name="msg"
              rows={5}
              value={form.msg}
              maxLength={CONTACT_LIMITS.msg}
              onChange={(e) => setForm({ ...form, msg: e.target.value })}
              placeholder="Cuéntanos qué tienes en mente…"
            />
          </div>
          <input
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            defaultValue=""
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
          />
          {error && (
            <p role="alert" className="pixel" style={{ color: "var(--magenta)", fontSize: 10, letterSpacing: "0.1em", margin: "0 0 14px" }}>
              ERROR AL ENVIAR. INTÉNTALO DE NUEVO.
            </p>
          )}
          <button className="btn xl press" type="submit" disabled={pending} style={{ width: "100%" }}>
            {pending ? "ENVIANDO…" : "▶  ENVIAR MENSAJE"}
          </button>
        </>
      ) : (
        <div className="terminal-success">
          <div className="term-bar">
            <span className="dot r"></span>
            <span className="dot y"></span>
            <span className="dot g"></span>
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line">
              <span className="prompt">vault@arcade:~$</span> ./send_message --to=team
            </div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            <div className="line success">
              &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {sent.toUpperCase()}.
              <span className="caret">_</span>
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="btn ghost" type="button" onClick={reset}>
                ENVIAR OTRO MENSAJE
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
