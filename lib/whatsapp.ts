/** Türkiye numarasını wa.me biçimine çevirir: 0532 123 45 67 -> https://wa.me/905321234567 */
export function whatsappUrl(phone: string, text?: string) {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = `90${digits.slice(1)}`;
  else if (digits.length === 10) digits = `90${digits}`;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
