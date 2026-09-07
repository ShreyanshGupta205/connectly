import type { SocialPlatform } from '../types';

export interface AISuggestionResult {
  tagline: string;
  bios: {
    builder: string;
    minimal: string;
    executive: string;
  };
  suggestedThemeId: string;
  suggestedLinks: {
    platform: SocialPlatform;
    title: string;
    subtitle: string;
    urlPattern: string;
  }[];
  skills: string[];
  category: 'Developer' | 'AI Builder' | 'Creator' | 'Student' | 'Designer' | 'Founder';
}

export const generateProfileWithAI = async (prompt: string): Promise<AISuggestionResult> => {
  // Simulate intelligent AI parsing
  await new Promise(resolve => setTimeout(resolve, 900));

  const lower = prompt.toLowerCase();

  if (lower.includes('ai') || lower.includes('machine learning') || lower.includes('data') || lower.includes('hackathon') || lower.includes('student')) {
    return {
      tagline: 'AI Engineer • Open Source Builder • Hackathon Creator',
      bios: {
        builder: 'Exploring Generative AI, building intelligent web agents, and explaining complex technology simply. Learn. Build. Ship.',
        minimal: 'Building the next frontier of AI tools. Open-source contributor & hackathon enthusiast.',
        executive: 'Undergraduate Software Engineer focused on Deep Learning systems, LLM orchestration, and high-impact digital products.'
      },
      suggestedThemeId: 'aurora-glass',
      suggestedLinks: [
        { platform: 'github', title: 'GitHub Projects', subtitle: 'Open-source models, agents & repos', urlPattern: 'https://github.com/' },
        { platform: 'youtube', title: 'YouTube Tutorials', subtitle: 'AI breakdowns & project builds', urlPattern: 'https://youtube.com/@' },
        { platform: 'linkedin', title: 'LinkedIn Connect', subtitle: 'Professional network & updates', urlPattern: 'https://linkedin.com/in/' },
        { platform: 'x', title: 'X / Tech Thoughts', subtitle: 'Building in public & AI papers', urlPattern: 'https://x.com/' },
        { platform: 'discord', title: 'Developer Community', subtitle: 'Collaborate on hackathons', urlPattern: 'https://discord.gg/' },
      ],
      skills: ['Python', 'PyTorch', 'TypeScript', 'LangChain', 'React', 'FastAPI'],
      category: 'AI Builder'
    };
  }

  if (lower.includes('design') || lower.includes('ui') || lower.includes('ux') || lower.includes('art') || lower.includes('creative') || lower.includes('video')) {
    return {
      tagline: 'Product Designer • Visual Storyteller • Creative Director',
      bios: {
        builder: 'Crafting fluid interfaces, spatial design systems, and delightful digital experiences that humans love to use.',
        minimal: 'Product & visual design. Designing at the intersection of craft and code.',
        executive: 'Lead Product Designer specializing in multi-platform design systems, interaction architecture, and brand strategy.'
      },
      suggestedThemeId: 'creator-studio',
      suggestedLinks: [
        { platform: 'dribbble', title: 'Dribbble Showcase', subtitle: 'Latest visual concepts & explorations', urlPattern: 'https://dribbble.com/' },
        { platform: 'instagram', title: 'Instagram Portfolio', subtitle: 'Visual diary & design experiments', urlPattern: 'https://instagram.com/' },
        { platform: 'website', title: 'Interactive Case Studies', subtitle: 'Selected client works & deep-dives', urlPattern: 'https://' },
        { platform: 'threads', title: 'Design Notes on Threads', subtitle: 'Daily UX tips and reflections', urlPattern: 'https://threads.net/' },
      ],
      skills: ['Figma', 'Design Systems', '3D Motion', 'Framer', 'Prototyping'],
      category: 'Designer'
    };
  }

  if (lower.includes('cyber') || lower.includes('security') || lower.includes('rust') || lower.includes('linux') || lower.includes('backend') || lower.includes('devops')) {
    return {
      tagline: 'Systems Architect • Security Researcher • Kernel Hacker',
      bios: {
        builder: 'Low-level systems enthusiast. Profiling performance, dissecting binaries, and building robust backend infrastructure.',
        minimal: 'Security research, distributed systems, and modern systems programming.',
        executive: 'Senior Infrastructure & Security Engineer delivering resilient high-throughput cloud architectures and penetration audits.'
      },
      suggestedThemeId: 'terminal-dev',
      suggestedLinks: [
        { platform: 'github', title: 'GitHub Security Tools', subtitle: 'Exploit audits & Rust libraries', urlPattern: 'https://github.com/' },
        { platform: 'website', title: 'Engineering & Research Blog', subtitle: 'Kernel deep dives & writeups', urlPattern: 'https://' },
        { platform: 'x', title: 'X (Security Feeds)', subtitle: 'CVE analysis & zero-day talk', urlPattern: 'https://x.com/' },
        { platform: 'email', title: 'PGP Encrypted Contact', subtitle: 'Direct key exchange', urlPattern: 'mailto:' },
      ],
      skills: ['Rust', 'Go', 'Linux Kernel', 'Docker/K8s', 'Reverse Engineering', 'Cryptography'],
      category: 'Developer'
    };
  }

  // Default Founder / Creator fallback
  return {
    tagline: 'Founder • Product Builder • Digital Creator',
    bios: {
      builder: 'Building modern digital products from zero to one. Sharing lessons on startups, tech, and audience building.',
      minimal: 'Building software products and documenting the journey. Passionate about technology and user experience.',
      executive: 'Entrepreneur and Technology Lead focused on building high-growth digital businesses and scalable software platforms.'
    },
    suggestedThemeId: 'neon-cyberpunk',
    suggestedLinks: [
      { platform: 'website', title: 'Featured Startup / Portfolio', subtitle: 'Explore what I\'m building right now', urlPattern: 'https://' },
      { platform: 'linkedin', title: 'LinkedIn Profile', subtitle: 'Connect for partnerships & investments', urlPattern: 'https://linkedin.com/in/' },
      { platform: 'x', title: 'X / Twitter Updates', subtitle: 'Behind the scenes startup insights', urlPattern: 'https://x.com/' },
      { platform: 'youtube', title: 'YouTube Channel', subtitle: 'Vlogs, tutorials and build demos', urlPattern: 'https://youtube.com/@' },
    ],
    skills: ['Product Strategy', 'Full Stack', 'SaaS Growth', 'TypeScript', 'UI/UX'],
    category: 'Founder'
  };
};
