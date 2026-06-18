/**
 * One-time repair for production member records:
 * - techaim10.9@gmail.com → Arnold Admin + valid createdAt
 * - Arnold Baillie emails → normalize createdAt
 *
 * Usage:
 *   node scripts/fix-production-members.mjs          # dry run
 *   node scripts/fix-production-members.mjs --apply  # write fixes
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');

const TECH_ADMIN_EMAIL = 'techaim10.9@gmail.com';
const ARNOLD_EMAILS = ['arnoldbaillie6@gmail.com', 'arnoldbailie6@gmail.com'];

function loadEnvLocal() {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) throw new Error('.env.local not found');
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = val;
  }
}

function toIso(v) {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (v?.toDate) return v.toDate().toISOString();
  if (typeof v === 'string') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString();
  if (typeof v === 'object' && typeof v._seconds === 'number') {
    const d = new Date(v._seconds * 1000);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

async function findUserByEmail(db, email) {
  const normalized = email.toLowerCase().trim();
  const snap = await db.collection('users').where('email', '==', normalized).limit(5).get();
  if (!snap.empty) return { id: snap.docs[0].id, data: snap.docs[0].data(), ref: snap.docs[0].ref };
  const all = await db.collection('users').limit(500).get();
  for (const doc of all.docs) {
    const e = (doc.data().email || '').toLowerCase().trim();
    if (e === normalized) return { id: doc.id, data: doc.data(), ref: doc.ref };
  }
  return null;
}

async function main() {
  loadEnvLocal();
  if (!getApps().length) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website',
    });
  }

  const db = getFirestore();
  const auth = getAuth();
  const now = new Date().toISOString();
  const changes = [];

  console.log(APPLY ? '\n=== APPLY MODE ===' : '\n=== DRY RUN (pass --apply to write) ===\n');

  const techUser = await findUserByEmail(db, TECH_ADMIN_EMAIL);
  if (!techUser) {
    console.log(`WARN: ${TECH_ADMIN_EMAIL} not found in Firestore`);
  } else {
    const patch = {
      firstName: 'Arnold',
      lastName: 'Admin',
      status: 'active',
      isActive: true,
      role: 'admin',
      roles: { admin: true },
      updatedAt: now,
    };
    const existingCreated = toIso(techUser.data.createdAt ?? techUser.data.created_at);
    if (!existingCreated) patch.createdAt = now;

    changes.push({
      id: techUser.id,
      email: TECH_ADMIN_EMAIL,
      action: 'rename_to_arnold_admin',
      before: {
        name: `${techUser.data.firstName || ''} ${techUser.data.lastName || ''}`.trim(),
        createdAt: techUser.data.createdAt ?? techUser.data.created_at,
      },
      after: { ...patch, createdAt: patch.createdAt || existingCreated },
    });

    if (APPLY) {
      await techUser.ref.set(patch, { merge: true });
      try {
        await auth.updateUser(techUser.id, { displayName: 'Arnold Admin' });
      } catch (err) {
        console.warn(`  Auth displayName update failed for ${techUser.id}:`, err.message);
      }
      console.log(`  FIXED ${TECH_ADMIN_EMAIL} → Arnold Admin`);
    } else {
      console.log(`  WOULD FIX ${TECH_ADMIN_EMAIL}:`, patch);
    }
  }

  for (const email of ARNOLD_EMAILS) {
    const arnold = await findUserByEmail(db, email);
    if (!arnold) continue;

    const existingCreated = toIso(arnold.data.createdAt ?? arnold.data.created_at);
    if (existingCreated && typeof arnold.data.createdAt === 'string') {
      console.log(`  SKIP ${email} — createdAt already ISO string`);
      continue;
    }

    const normalizedCreated = existingCreated || now;
    changes.push({
      id: arnold.id,
      email,
      action: 'normalize_createdAt',
      before: { createdAt: arnold.data.createdAt ?? arnold.data.created_at },
      after: { createdAt: normalizedCreated },
    });

    if (APPLY) {
      await arnold.ref.set({ createdAt: normalizedCreated, updatedAt: now }, { merge: true });
      console.log(`  FIXED ${email} createdAt → ${normalizedCreated}`);
    } else {
      console.log(`  WOULD FIX ${email} createdAt → ${normalizedCreated}`);
    }
    break;
  }

  const allSnap = await db.collection('users').get();
  const remaining = [];
  for (const doc of allSnap.docs) {
    const data = doc.data();
    const iso = toIso(data.createdAt ?? data.created_at);
    remaining.push({
      id: doc.id,
      email: data.email,
      name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      createdAt: iso || 'MISSING',
    });
    if (!iso) {
      console.log(`  WARN: still missing createdAt — ${data.email} (${doc.id})`);
    }
  }

  const report = {
    mode: APPLY ? 'apply' : 'dry-run',
    completedAt: now,
    changes,
    usersAfter: remaining,
    totalUsers: allSnap.size,
  };

  const outPath = path.join(ROOT, 'scripts', 'fix-production-members-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nTotal users: ${allSnap.size}`);
  console.log(`Report: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
