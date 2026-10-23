export interface QrAvailability {
  duitnow: boolean;
  tng: boolean;
  anyAvailable: boolean;
}

export async function checkQrImages(): Promise<QrAvailability> {
  const checkUrl = async (url: string): Promise<boolean> => {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (!res.ok) return false;
      const ct = res.headers.get('content-type');
      // If it returned an HTML fallback (SPA 200 index.html), the file does not exist
      if (ct && ct.includes('text/html')) return false;
      return true;
    } catch {
      return false;
    }
  };

  try {
    const [duitnow, tng] = await Promise.all([
      checkUrl('/assets/qr-duitnow.png'),
      checkUrl('/assets/qr-tng.png'),
    ]);

    return {
      duitnow,
      tng,
      anyAvailable: duitnow || tng,
    };
  } catch {
    return { duitnow: false, tng: false, anyAvailable: false };
  }
}
