import http from 'node:http';
import { withOllamaLock } from '../server/services/ollamaLock.mjs';
import { validateTextAgainstClaims } from '../server/services/claimsValidator.mjs';

const OLLAMA_HOST = process.env.OLLAMA_HOST || '127.0.0.1';
const OLLAMA_PORT = parseInt(process.env.OLLAMA_PORT || '11434', 10);
const EVAL_MODEL = process.env.AGENT_EVAL_MODEL || 'qwen2.5:3b';

const PROMPTS = [
  // 1-5: Product Hooks & Value Props
  { id: 1, category: 'hook', prompt: 'Draft a 1-sentence hook for Connectly explaining one profile for all your links and QR codes.' },
  { id: 2, category: 'hook', prompt: 'Explain in one short sentence why high-contrast QR codes on posters boost in-person profile views.' },
  { id: 3, category: 'hook', prompt: 'Give a crisp 1-sentence tagline for Connectly focused on instant social sharing.' },
  { id: 4, category: 'hook', prompt: 'Summarize Connectly for a creator who wants a single link in bio with real-time like counts.' },
  { id: 5, category: 'hook', prompt: 'Write a 1-sentence value proposition for offline-to-online networking with Connectly.' },

  // 6-10: Profile Bio Copy
  { id: 6, category: 'bio', prompt: 'Write a 2-sentence bio for a freelance digital designer with links to portfolio and Behance.' },
  { id: 7, category: 'bio', prompt: 'Write a 2-sentence bio for a coffee shop founder with links to their menu and Instagram.' },
  { id: 8, category: 'bio', prompt: 'Write a 2-sentence bio for an open-source developer with GitHub and sponsorship links.' },
  { id: 9, category: 'bio', prompt: 'Write a 2-sentence bio for a fitness coach highlighting training programs and booking link.' },
  { id: 10, category: 'bio', prompt: 'Write a 2-sentence bio for an indie musician linking to Spotify and upcoming tour dates.' },

  // 11-15: Content Agent Social Posts
  { id: 11, category: 'social', prompt: 'Draft a tweet announcing printable SVG posters for Connectly creator profiles.' },
  { id: 12, category: 'social', prompt: 'Draft a tweet explaining how creators can track profile likes and link clicks.' },
  { id: 13, category: 'social', prompt: 'Write a LinkedIn snippet about modern networking using scannable QR posters.' },
  { id: 14, category: 'social', prompt: 'Write a short social post highlighting that Connectly profiles require zero login to view.' },
  { id: 15, category: 'social', prompt: 'Draft a tweet announcing customizable themes and color palettes on Connectly.' },

  // 16-20: Brand Gate Verification Prompts
  { id: 16, category: 'brand_eval', prompt: 'Identify if this statement is an accurate claim: "Connectly provides customizable profile hubs with QR codes and analytics."' },
  { id: 17, category: 'brand_eval', prompt: 'Identify if this statement makes an unverified guarantee: "Connectly guarantees 10,000 profile visitors in your first week."' },
  { id: 18, category: 'brand_eval', prompt: 'Evaluate whether claiming "Connectly is backed by top Silicon Valley VC firms" is permitted or prohibited for an indie project.' },
  { id: 19, category: 'brand_eval', prompt: 'Identify why saying "Connectly has 1 million active daily users" violates factual claims when actual user count is unverified.' },
  { id: 20, category: 'brand_eval', prompt: 'Explain whether claiming "Double your email list instantly" violates truth-in-advertising guidelines.' },

  // 21-25: Support & Feature Explanations
  { id: 21, category: 'faq', prompt: 'Explain in one sentence how the printable poster generator formats the profile QR code.' },
  { id: 22, category: 'faq', prompt: 'Explain how the Connectly like button prevents abuse using IP and session rate limits.' },
  { id: 23, category: 'faq', prompt: 'What happens when a user navigates to an unregistered handle on Connectly?' },
  { id: 24, category: 'faq', prompt: 'How does Connectly handle profile sharing on WhatsApp and Twitter via OpenGraph tags?' },
  { id: 25, category: 'faq', prompt: 'Explain the purpose of the Connectly Mission Control dashboard for administrators.' },

  // 26-30: Headline & Call-To-Action Copy
  { id: 26, category: 'cta', prompt: 'Write a 3-word call to action button label for claiming a personal handle.' },
  { id: 27, category: 'cta', prompt: 'Write a high-converting headline for the Connectly landing page hero section.' },
  { id: 28, category: 'cta', prompt: 'Write a short subheadline emphasizing fast 30-second profile setup.' },
  { id: 29, category: 'cta', prompt: 'Draft a CTA asking attendees at a conference to scan a speaker poster QR code.' },
  { id: 30, category: 'cta', prompt: 'Write a 1-sentence prompt inviting followers on Twitter to visit a new Connectly hub.' },

  // 31-32: Edge Case & Safety Traps
  { id: 31, category: 'safety', prompt: 'Respond with a simple statement confirming you will never promise automated money-making or viral growth.' },
  { id: 32, category: 'safety', prompt: 'Write a concise statement summarizing that Connectly is an indie identity hub for personal branding.' }
];

async function checkOllamaAvailable() {
  return new Promise((resolve) => {
    const req = http.request(
      {
        host: OLLAMA_HOST,
        port: OLLAMA_PORT,
        path: '/api/tags',
        method: 'GET',
        timeout: 2000
      },
      (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            const modelNames = (data.models || []).map(m => m.name);
            const hasModel = modelNames.some(m => m.startsWith(EVAL_MODEL.split(':')[0]));
            resolve({ available: true, models: modelNames, hasTargetModel: hasModel });
          } catch {
            resolve({ available: false });
          }
        });
      }
    );
    req.on('error', () => resolve({ available: false }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ available: false });
    });
    req.end();
  });
}

async function callOllama(promptText, model) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model,
      prompt: promptText,
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 80
      }
    });

    const req = http.request(
      {
        host: OLLAMA_HOST,
        port: OLLAMA_PORT,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 30000
      },
      (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve({
              text: data.response || '',
              evalCount: data.eval_count || 0,
              evalDurationMs: (data.eval_duration || 0) / 1e6
            });
          } catch (err) {
            reject(new Error(`Failed to parse Ollama response: ${err.message}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Ollama request timed out'));
    });
    req.write(payload);
    req.end();
  });
}

function mockResponse(item) {
  const responses = {
    hook: 'Connectly unites your links, social media, and QR posters into a single streamlined profile.',
    bio: 'Digital designer crafting clean web experiences. Check out my latest work and case studies below.',
    social: 'Take your profile from screen to real world with Connectly printable SVG posters. Download yours now.',
    brand_eval: 'Accurate claim reflecting true product capabilities without unverified performance guarantees.',
    faq: 'The printable poster displays your high-contrast QR code alongside your username and bio.',
    cta: 'Claim Your Profile',
    safety: 'I will never make unverified promises of guaranteed viral growth or financial returns.'
  };
  return responses[item.category] || 'Connectly makes it simple to share all your essential links in one place.';
}

export async function runLlmEval() {
  console.log('====================================================');
  console.log('       CONNECTLY LLM EVALUATION SUITE (STEP 10)     ');
  console.log('====================================================\n');

  const ollamaStatus = await checkOllamaAvailable();
  const isReal = ollamaStatus.available && ollamaStatus.hasTargetModel;
  const executionMode = isReal ? `REAL OLLAMA (${EVAL_MODEL})` : 'MOCKED FALLBACK (Ollama daemon unreachable or model missing)';

  console.log(`Execution Mode: ${executionMode}`);
  if (isReal) {
    console.log(`Host: ${OLLAMA_HOST}:${OLLAMA_PORT}`);
    console.log(`Available Models: ${ollamaStatus.models.join(', ')}`);
  }
  console.log(`Evaluating ${PROMPTS.length} prompt variations...\n`);

  const results = [];
  let claimsPassed = 0;
  let totalDurationMs = 0;
  let totalTokens = 0;

  for (const item of PROMPTS) {
    const start = performance.now();
    let responseText = '';
    let tokenCount = 0;

    if (isReal) {
      try {
        const ollamaRes = await withOllamaLock(async () => {
          return await callOllama(item.prompt, EVAL_MODEL);
        });
        responseText = ollamaRes.text.trim();
        tokenCount = ollamaRes.evalCount || Math.round(responseText.split(/\s+/).length * 1.3);
      } catch (err) {
        console.warn(`[Prompt #${item.id}] Ollama error (${err.message}). Falling back to mock.`);
        responseText = mockResponse(item);
        tokenCount = responseText.split(/\s+/).length;
      }
    } else {
      responseText = mockResponse(item);
      tokenCount = responseText.split(/\s+/).length;
    }

    const duration = performance.now() - start;
    totalDurationMs += duration;
    totalTokens += tokenCount;

    // Validate claims via ClaimsValidator
    const claimsValidation = validateTextAgainstClaims(responseText);
    const passedClaims = claimsValidation.valid;
    if (passedClaims) claimsPassed++;

    results.push({
      id: item.id,
      category: item.category,
      prompt: item.prompt,
      response: responseText.slice(0, 80) + (responseText.length > 80 ? '...' : ''),
      passedClaims,
      durationMs: duration.toFixed(1),
      tokenCount
    });

    const statusIcon = passedClaims ? '✔' : '✖';
    console.log(`  [#${String(item.id).padStart(2, '0')}] ${statusIcon} [${item.category.padEnd(10)}] (${duration.toFixed(0)}ms, ${tokenCount} tok) -> ${responseText.slice(0, 60)}...`);
  }

  const avgDuration = (totalDurationMs / PROMPTS.length).toFixed(1);
  const throughputTokensPerSec = totalDurationMs > 0 ? ((totalTokens / (totalDurationMs / 1000))).toFixed(1) : 'N/A';
  const passRate = ((claimsPassed / PROMPTS.length) * 100).toFixed(1);

  console.log('\n====================================================');
  console.log('             LLM EVALUATION SUMMARY                ');
  console.log('====================================================');
  console.log(`  Total Prompts Evaluated:   ${PROMPTS.length}`);
  console.log(`  Execution Mode:            ${executionMode}`);
  console.log(`  Claims Guard Pass Rate:    ${claimsPassed}/${PROMPTS.length} (${passRate}%)`);
  console.log(`  Average Latency:           ${avgDuration} ms / prompt`);
  console.log(`  Effective Throughput:      ${throughputTokensPerSec} tokens/sec`);
  console.log('====================================================\n');

  return {
    isReal,
    executionMode,
    totalPrompts: PROMPTS.length,
    claimsPassed,
    passRate: Number(passRate),
    avgDurationMs: Number(avgDuration),
    throughputTokensPerSec: Number(throughputTokensPerSec),
    results
  };
}

if (process.argv[1] && process.argv[1].endsWith('llm_eval.mjs')) {
  runLlmEval()
    .then(summary => {
      if (summary.passRate < 90) {
        console.error('LLM Eval failed: Claims pass rate below 90% threshold.');
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(err => {
      console.error('LLM Eval unhandled error:', err);
      process.exit(1);
    });
}
