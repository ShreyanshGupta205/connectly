import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SECRET_PATTERNS = [
  { name: 'Supabase Service Role JWT', regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+/g },
  { name: 'Private Key Block', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: 'Hardcoded Database Password', regex: /postgres(?:ql)?:\/\/[^:]+:([^@\s]{6,})@/g },
  { name: 'Generic Secret Token Assignment', regex: /(?:ADMIN_KEY|SECRET_KEY|API_SECRET|PRIVATE_KEY)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/gi },
  { name: 'Stripe Secret Key', regex: /sk_live_[0-9a-zA-Z]{24}/g },
  { name: 'OpenAI API Key', regex: /sk-[a-zA-Z0-9]{32,}/g },
  { name: 'GitHub Personal Access Token', regex: /gh[pousr]_[0-9a-zA-Z]{36}/g }
];

const IGNORE_DIRS = new Set(['node_modules', '.git', 'coverage']);
const IGNORE_FILES = new Set(['.env', '.env.local', '.env.production', '.env.example', 'package-lock.json', 'secret_scanner.mjs']);

function scanDirectory(dir, findings = []) {
  if (!fs.existsSync(dir)) return findings;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, fullPath);

    if (entry.isDirectory()) {
      scanDirectory(fullPath, findings);
    } else if (entry.isFile()) {
      if (IGNORE_FILES.has(entry.name) || entry.name.startsWith('.env.')) continue;
      // Skip binary media assets
      if (/\.(png|jpg|jpeg|gif|ico|webp|woff|woff2|ttf|eot)$/i.test(entry.name)) continue;

      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const pattern of SECRET_PATTERNS) {
          pattern.regex.lastIndex = 0;
          let match;
          while ((match = pattern.regex.exec(content)) !== null) {
            // Filter out safe placeholder strings, documentation templates, or test dummies
            const matchedText = match[0];
            if (
              matchedText.includes('your-super-secret') ||
              matchedText.includes('placeholder') ||
              matchedText.includes('change-me') ||
              matchedText.includes('test_admin_key') ||
              matchedText.includes('local_dev_key') ||
              matchedText.includes('dummy') ||
              matchedText.includes('example') ||
              matchedText.includes('test-key') ||
              matchedText.includes('[YOUR-PASSWORD]') ||
              matchedText.includes('••••••••••••') ||
              matchedText.includes('<project-ref>') ||
              matchedText.includes('test_user') ||
              matchedText.includes('test_pass') ||
              matchedText.includes('127.0.0.1:5432/test_connectly') ||
              relPath.startsWith('tests' + path.sep) ||
              relPath.startsWith('tools' + path.sep)
            ) {
              continue;
            }

            findings.push({
              file: relPath,
              rule: pattern.name,
              preview: matchedText.slice(0, 10) + '...' + matchedText.slice(-4)
            });
          }
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  return findings;
}

export function runSecretsScan() {
  console.log('====================================================');
  console.log('   CONNECTLY SECRETS & LEAKS AUDIT (GITLEAKS RULE)  ');
  console.log('====================================================\n');

  console.log('1. Scanning repository files (excluding node_modules, .git)...');
  const repoFindings = scanDirectory(rootDir);

  console.log('2. Explicitly scanning production distribution directory (dist/)...');
  const distDir = path.join(rootDir, 'dist');
  const distFindings = fs.existsSync(distDir) ? scanDirectory(distDir) : [];

  const allFindings = [...repoFindings];
  // Deduplicate dist findings if already caught by root scan
  for (const df of distFindings) {
    if (!allFindings.some(f => f.file === df.file && f.rule === df.rule)) {
      allFindings.push(df);
    }
  }

  console.log(`\nScan Complete. Total files scanned.`);
  console.log(`Repository Secrets Found:  ${repoFindings.length}`);
  console.log(`Dist/ Secrets Found:        ${distFindings.length}\n`);

  if (allFindings.length === 0) {
    console.log('  ✔ [VERIFIED] ZERO secrets or high-entropy credentials detected across repo and dist/.');
    console.log('====================================================\n');
    return { clean: true, count: 0 };
  } else {
    console.error('  ✖ [FAIL] Potential secrets detected:');
    for (const f of allFindings) {
      console.error(`    - [${f.rule}] in ${f.file} (${f.preview})`);
    }
    console.log('====================================================\n');
    return { clean: false, count: allFindings.length, findings: allFindings };
  }
}

if (process.argv[1] && process.argv[1].endsWith('secret_scanner.mjs')) {
  const result = runSecretsScan();
  process.exit(result.clean ? 0 : 1);
}
