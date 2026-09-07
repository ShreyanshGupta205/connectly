import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const faqs = [
    {
      q: 'Is Connectly really free to use?',
      a: 'Yes! Connectly offers a Free Forever plan with unlimited links, customizable themes, live visitor analytics, QR poster generation, and visitor like bursts. There are no surprise fees or required credit cards.',
    },
    {
      q: 'How does the Printable QR Poster Studio work?',
      a: 'Inside the Creator Studio, navigate to the QR Studio tab or click Print Poster. You can choose from presets (Event Desk Poster, Hacker Badge / Lanyard, Minimal Sticker), customize headline copy, and download a crisp, print-ready high-DPI poster directly in your browser.',
    },
    {
      q: 'What is the 1-Click vCard (.vcf) export feature?',
      a: 'When someone scans your physical poster or visits your profile link, they can click "Save Contact". This downloads an RFC 6350 .vcf contact card that instantly adds your name, bio, website, and social channels into their iOS or Android Contacts app without manual typing.',
    },
    {
      q: 'Can I track which links get the most clicks and where visitors come from?',
      a: 'Absolutely. Connectly provides a real-time Analytics dashboard tracking total profile views, individual link clicks, click-through rate (CTR), visitor device types (Mobile vs Desktop), and top referrer platforms (YouTube, Twitter, GitHub, QR Scans).',
    },
    {
      q: 'Can I use custom aesthetic themes like Cyberpunk or Glassmorphism?',
      a: 'Yes. Connectly comes loaded with 8 handcrafted aesthetic presets, including Aurora Glass, Cyberpunk Neon, Luxe Gold, Minimalist Slate, and Midnight Velvet. You can also customize font styles and button shapes with real-time phone preview.',
    },
    {
      q: 'How do the visitor ❤️ like reactions work?',
      a: 'Unlike traditional static link trees, visitors to your Connectly profile can tap the ❤️ button to leave an instant like. It triggers a burst animation and increments your live counter, giving you real social validation from your community.',
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section className="py-24 bg-slate-950 border-b border-white/5 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Everything you need to know about Connectly
          </h2>
          <p className="text-slate-400 text-base mt-3">
            Have questions? We've got answers. If you need anything else, open the studio and start building.
          </p>
        </div>

        {/* Accordion list */}
        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden backdrop-blur-xl ${
                  isOpen 
                    ? 'bg-slate-900/90 border-indigo-500/30 shadow-xl shadow-indigo-950/30' 
                    : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                }`}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-white hover:text-indigo-300 transition-colors"
                >
                  <span className="text-base sm:text-lg">{faq.q}</span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-slate-300 text-sm sm:text-base leading-relaxed border-t border-white/5 pt-3 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
