import html2canvas from 'html2canvas';
import type { UserProfile } from '../types';

export const generateVCard = (profile: UserProfile): string => {
  const vCard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${profile.name}`,
    `N:${profile.name};;;;`,
    `TITLE:${profile.tagline}`,
    `NOTE:${profile.bio}`,
    profile.email ? `EMAIL;TYPE=INTERNET:${profile.email}` : '',
    `URL:${window.location.origin}/#/@${profile.username}`,
    'END:VCARD'
  ].filter(Boolean).join('\r\n');

  return `data:text/vcard;charset=utf-8,${encodeURIComponent(vCard)}`;
};

export const downloadElementAsImage = async (
  elementId: string, 
  filename: string, 
  format: 'png' | 'jpeg' = 'png',
  scale: number = 3
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
    });

    const dataUrl = canvas.toDataURL(`image/${format}`, 1.0);
    const link = document.createElement('a');
    link.download = `${filename}.${format}`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error downloading element as image:', error);
  }
};

export const getSocialShareUrls = (username: string, profileName: string) => {
  const url = `${window.location.origin}/#/@${username}`;
  const text = `Check out ${profileName}'s verified digital identity and links on Connectly! 🚀`;

  return {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
    email: `mailto:?subject=${encodeURIComponent(`Connect with ${profileName}`)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
    directUrl: url,
  };
};
