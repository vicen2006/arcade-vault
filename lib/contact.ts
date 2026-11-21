export interface ContactInput {
  name: string;
  email: string;
  msg: string;
}

export type ContactResult =
  | { ok: true; name: string }
  | { ok: false; error: "invalid" | "send_failed" };

export const CONTACT_LIMITS = { name: 60, email: 120, msg: 2000 } as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(input: ContactInput): boolean {
  const name = input.name.trim();
  const email = input.email.trim();
  const msg = input.msg.trim();

  return (
    name.length >= 1 &&
    name.length <= CONTACT_LIMITS.name &&
    email.length <= CONTACT_LIMITS.email &&
    EMAIL_RE.test(email) &&
    msg.length >= 1 &&
    msg.length <= CONTACT_LIMITS.msg
  );
}
