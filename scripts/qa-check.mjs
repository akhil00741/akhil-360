import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const listFiles = (directory, extension) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const fullPath = resolve(directory, entry.name);

  if (entry.isDirectory()) {
    return listFiles(fullPath, extension);
  }

  return extname(entry.name) === extension ? [fullPath] : [];
});

const wfolioBadge = read('src/components/WfolioBadge.tsx');
const shootDetailModal = read('src/components/ShootDetailModal.tsx');
const dashboardView = read('src/components/DashboardView.tsx');
const contactsView = read('src/components/ContactsView.tsx');
const bottomNav = read('src/components/BottomNav.tsx');
const appView = read('src/App.tsx');
const shootContext = read('src/context/ShootContext.tsx');
const cloudSync = read('src/utils/cloudSync.ts');
const contactBook = read('src/utils/contactBook.ts');
const sessionTracking = read('src/utils/sessionTracking.ts');
const calendarSync = read('src/utils/calendarSync.ts');
const componentText = listFiles(resolve(root, 'src/components'), '.tsx')
  .map((filePath) => readFileSync(filePath, 'utf8'))
  .join('\n');

const checks = [
  {
    name: 'wfolio delivery card avoids the old low-contrast dark gradient',
    pass: !/from-indigo-950|via-purple-950|to-black|bg-indigo-950|bg-zinc-900\/60/.test(wfolioBadge),
  },
  {
    name: 'wfolio card shows copy details, link-only copy, and PIN without local-link messaging',
    pass:
      /Copy Details/.test(wfolioBadge) &&
      /Copy Link Only/.test(wfolioBadge) &&
      /PIN/.test(wfolioBadge) &&
      !/Local\/test link saved|real wfolio gallery URL|Local/.test(wfolioBadge),
  },
  {
    name: 'wfolio links are normalized and opening is disabled for invalid URLs',
    pass:
      /getGalleryUrlState/.test(wfolioBadge) &&
      /parsed\.protocol === 'http:' \|\| parsed\.protocol === 'https:'/.test(wfolioBadge) &&
      /disabled=\{!gallery\.isValid\}/.test(wfolioBadge),
  },
  {
    name: 'client contact copy remains available inside shoot detail',
    pass: /Client Contact & Copy/.test(shootDetailModal) && /ContactQuickActions/.test(shootDetailModal),
  },
  {
    name: 'today briefing is driven by event sessions and venues',
    pass:
      /todaySessions/.test(dashboardView) &&
      /getShootSessionStates/.test(dashboardView) &&
      /event\.venue \|\| shoot\.location/.test(dashboardView) &&
      !/todayShoots/.test(dashboardView),
  },
  {
    name: 'automatic stage status follows booked, in progress, editing, delivered, and data cleared',
    pass:
      /getAutomaticShootStatus/.test(sessionTracking) &&
      /return 'booked'/.test(sessionTracking) &&
      /return 'in_progress'/.test(sessionTracking) &&
      /return 'editing'/.test(sessionTracking) &&
      /return 'delivered'/.test(sessionTracking) &&
      /return 'data_cleared'/.test(sessionTracking),
  },
  {
    name: 'traffic panel language is removed from UI and calendar reminders',
    pass: !/Beat the Traffic|Google Maps Live|Apple Maps Traffic|beat the traffic|live traffic|Check traffic/i.test(`${componentText}\n${calendarSync}`),
  },
  {
    name: 'cash-in-hand language is absent from visible components',
    pass: !/\bcash\b|cash in hand/i.test(componentText),
  },
  {
    name: 'production build does not expose demo reset or seeded test records',
    pass:
      !/Reset Demo Data|sample demo data|resetToSampleData|INITIAL_SHOOTS|Shivaansh|Live Studio|Test Shoot/.test(`${componentText}\n${shootContext}`) &&
      /akhil_360_shoots_prod_v2/.test(shootContext),
  },
  {
    name: 'cloud sync is opt-in through environment variables',
    pass:
      /VITE_ENABLE_CLOUD_SYNC/.test(cloudSync) &&
      /VITE_FIREBASE_API_KEY/.test(cloudSync) &&
      !/AIzaSy|akhil-360-default-rtdb|794900112395/.test(cloudSync),
  },
  {
    name: 'contacts auto-save from shoots and are reachable from navigation',
    pass:
      /upsertContactsFromShoots/.test(shootContext) &&
      /CONTACTS_KEY/.test(shootContext) &&
      /Client Contact Book/.test(contactsView) &&
      /contactsToVCard/.test(contactsView) &&
      /id: 'contacts'/.test(bottomNav) &&
      /activeTab === 'contacts'/.test(appView),
  },
  {
    name: 'contact book deduplicates clients and supports vCard export',
    pass:
      /upsertContactFromShoot/.test(contactBook) &&
      /getContactKey/.test(contactBook) &&
      /contactsToVCard/.test(contactBook) &&
      /BEGIN:VCARD/.test(contactBook),
  },
];

const failedChecks = checks.filter((check) => !check.pass);

for (const check of checks) {
  const prefix = check.pass ? 'PASS' : 'FAIL';
  console.log(`${prefix} ${check.name}`);
}

if (failedChecks.length > 0) {
  console.error(`\n${failedChecks.length} QA check${failedChecks.length === 1 ? '' : 's'} failed.`);
  process.exit(1);
}

console.log('\nAll focused RAM app QA checks passed.');
