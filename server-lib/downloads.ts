import { getEnv } from './env.ts';

export function getDownloadLink(pack: '100' | '200'): string | null {
  const link =
    pack === '200'
      ? getEnv('DOWNLOAD_LINK_200') || (process.env.NODE_ENV !== 'production' ? 'https://drive.google.com/drive/folders/1bw7ChoyRw9NE7Jyzdt6CEZGp8w0SrKTu?usp=sharing' : undefined)
      : getEnv('DOWNLOAD_LINK_100') || (process.env.NODE_ENV !== 'production' ? 'https://drive.google.com/drive/folders/1bw7ChoyRw9NE7Jyzdt6CEZGp8w0SrKTu?usp=sharing' : undefined);

  if (!link) {
    console.error(`[Download Link Missing] DOWNLOAD_LINK_${pack} is not configured.`);
    return null;
  }
  return link;
}
