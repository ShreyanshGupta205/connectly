/**
 * vcardUtils.ts
 * Generates an RFC 6350 compliant vCard (.vcf) for 1-click contact saving
 * on iOS, Android, macOS, and Windows.
 */
import type { UserProfile } from '../types';

export function generateVCard(profile: UserProfile): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${profile.name || profile.username}`,
    `N:;${profile.name || profile.username};;;`,
  ];

  if (profile.tagline) {
    lines.push(`TITLE:${profile.tagline}`);
  }

  if (profile.bio) {
    lines.push(`NOTE:${profile.bio.replace(/\n/g, '\\n')}`);
  }

  // Add website/profile URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://connectly.bio';
  const profileUrl = `${currentOrigin}/#/@${profile.username}`;
  lines.push(`URL:${profileUrl}`);

  // Add social profiles as X-SOCIALPROFILE
  profile.links.forEach(link => {
    if (link.url && link.isVisible) {
      if (link.platform === 'email') {
        const cleanEmail = link.url.replace(/^mailto:/i, '');
        lines.push(`EMAIL;TYPE=INTERNET:${cleanEmail}`);
      } else if (link.platform === 'whatsapp') {
        const phoneMatch = link.url.match(/\d+/g);
        if (phoneMatch) {
          lines.push(`TEL;TYPE=CELL:+${phoneMatch.join('')}`);
        }
      } else {
        lines.push(`X-SOCIALPROFILE;TYPE=${link.platform}:${link.url}`);
      }
    }
  });

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export function downloadVCard(profile: UserProfile): void {
  const vcardData = generateVCard(profile);
  const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${profile.username || 'contact'}.vcf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
