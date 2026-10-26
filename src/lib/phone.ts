/* Shared by the lead form and its API route. Loose on purpose: digits plus the
   separators people actually type, so "+1 (555) 010-0000" passes. */
const PHONE = /^\+?[\d\s().-]{7,24}$/;

export function isPhone(value: string): boolean {
  const phone = value.trim();
  return PHONE.test(phone) && phone.replace(/\D/g, "").length >= 7;
}
