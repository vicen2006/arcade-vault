"use server";

import { Resend } from "resend";
import { validateContact, type ContactResult } from "@/lib/contact";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function sendContact(formData: FormData): Promise<ContactResult> {
  const name = field(formData, "name").trim();
  const email = field(formData, "email").trim();
  const msg = field(formData, "msg").trim();

  // Honeypot: un bot rellena el campo oculto; se descarta en silencio.
  if (field(formData, "website") !== "") return { ok: true, name };

  if (!validateContact({ name, email, msg })) {
    return { ok: false, error: "invalid" };
  }

  try {
    const to = process.env.CONTACT_TO_EMAIL;
    const from = process.env.CONTACT_FROM_EMAIL;
    if (!to || !from) return { ok: false, error: "send_failed" };

    // El constructor lanza si falta RESEND_API_KEY, por eso va dentro del try.
    const resend = new Resend(process.env.RESEND_API_KEY);
    const safeName = name.replace(/[\r\n]+/g, " ");

    const { error } = await resend.emails.send({
      from,
      to,
      subject: `[Arcade Vault] Mensaje de ${safeName}`,
      text: `Nombre: ${safeName}\nCorreo: ${email}\n\nMensaje:\n${msg}`,
    });
    if (error) return { ok: false, error: "send_failed" };

    return { ok: true, name: safeName };
  } catch {
    return { ok: false, error: "send_failed" };
  }
}
