export interface ValidatedCheckoutInput {
  pack: '100' | '200';
  name: string;
  email: string;
  phone: string;
}

export function validateCheckoutInput(
  data: any
): { ok: true; value: ValidatedCheckoutInput } | { ok: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'Invalid request body.' };
  }

  const selectedPack: '100' | '200' = data.pack === '200' ? '200' : '100';
  const cleanName = typeof data.name === 'string' ? data.name.trim() : '';
  const cleanEmail = typeof data.email === 'string' ? data.email.trim() : '';
  const cleanPhone =
    typeof data.phone === 'string' ? data.phone.trim().replace(/[\s\-()]/g, '') : '';

  if (!cleanName || cleanName.length < 2) {
    return { ok: false, error: 'Please enter your full name.' };
  }
  if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (!cleanPhone || cleanPhone.length < 8) {
    return { ok: false, error: 'Please enter a valid Malaysian phone number.' };
  }

  return {
    ok: true,
    value: {
      pack: selectedPack,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
    },
  };
}

export function generateOrderId(): string {
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `SMV-${Date.now()}-${randomSuffix}`;
}

export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
}
