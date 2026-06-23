/**
 * k6 stress test — Print2Play user flow
 *
 * Tests what real users actually do: SSR page loads through the full Next.js
 * pipeline, plus one forge save to stress the Postgres JSONB write path.
 *
 * Each VU gets a dedicated account from the seeded pool (k6user_001 …
 * k6user_100) so DB queries hit different rows — no shared-cache optimism.
 *
 * Prerequisites:
 *   1. activate-staging.sh ran on the staging VM (seeds pool + character data)
 *   2. k6 installed: `sudo apt install k6` (Linux) or `winget install k6` (Windows)
 *
 * Run:
 *   k6 run --env BASE_URL=https://staging.yourdomain.com stress-tests/user-flow.js
 *
 * Optional env overrides:
 *   --env POOL_SIZE=100      match the value used when seeding (default 100)
 *   --env K6_PASSWORD=...    if you changed the test password
 *
 * Scaling — verify 0 errors at each step before moving up:
 *   1 → 10 → 50 → 100 → 250+
 *   Monitor staging VM: docker stats
 *
 * ── Adding the real forge save (recommended) ─────────────────────────────────
 * The forge save endpoint below (/api/stress/…) does a real DB round-trip but
 * is not the actual code path the app uses. The real path is a Next.js Server
 * Action. To test it properly:
 *
 *   1. After activate-staging.sh runs, open the staging URL in a browser
 *   2. Go to /forge/k6-char-001 and open DevTools → Network tab
 *   3. Type one character in the Name field (triggers autosave)
 *   4. Find the POST to /forge/k6-char-001 — copy the Next-Action header value
 *   5. Replace NEXT_ACTION_ID below and uncomment the server action block
 *
 * The hash is stable for the lifetime of a built image (changes on rebuild).
 */

import http from "k6/http";
import { sleep, check } from "k6";

const BASE_URL  = (__ENV.BASE_URL  || "https://staging.yourdomain.com").replace(/\/$/, "");
const POOL_SIZE = parseInt(__ENV.POOL_SIZE  || "100", 10);
const PASSWORD  = __ENV.K6_PASSWORD || "K6TestUser123!";

// Paste the Next-Action hash here after extracting from DevTools (see above).
// const NEXT_ACTION_ID = "PASTE_HASH_HERE";

export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "2m",  target: 50 },
    { duration: "30s", target: 0  },
  ],
  thresholds: {
    http_req_failed:   ["rate<0.01"],
    http_req_duration: ["p(95)<3000"],
  },
};

function jitter(min, max) {
  return Math.random() * (max - min) + min;
}

export default function () {
  // Each VU gets a fixed slot in the pool → unique DB rows per VU
  const slot = String((__VU - 1) % POOL_SIZE + 1).padStart(3, "0");
  const username    = `k6user_${slot}`;
  const characterId = `k6-char-${slot}`;

  // ── 1. CSRF token ─────────────────────────────────────────────────────────
  let res = http.get(`${BASE_URL}/api/auth/csrf`);
  if (!check(res, { "csrf 200": (r) => r.status === 200 })) return;
  const csrfToken = res.json("csrfToken");
  sleep(jitter(0.3, 0.8));

  // ── 2. Login ──────────────────────────────────────────────────────────────
  const loginBody =
    `csrfToken=${encodeURIComponent(csrfToken)}` +
    `&username=${encodeURIComponent(username)}` +
    `&password=${encodeURIComponent(PASSWORD)}` +
    `&redirect=false&json=true` +
    `&callbackUrl=${encodeURIComponent(BASE_URL + "/characters")}`;

  res = http.post(`${BASE_URL}/api/auth/callback/credentials`, loginBody, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  if (!check(res, { "login 200": (r) => r.status === 200 })) {
    console.error(`Login failed VU=${__VU} slot=${slot}: ${res.status} ${res.body}`);
    return;
  }
  sleep(jitter(0.5, 2));

  // ── 3. Character list (SSR — DB query + auth middleware) ──────────────────
  res = http.get(`${BASE_URL}/characters`);
  check(res, { "character list 200": (r) => r.status === 200 });
  sleep(jitter(1, 3));

  // ── 4. Forge page shell ───────────────────────────────────────────────────
  res = http.get(`${BASE_URL}/forge/${characterId}`);
  check(res, { "forge page 200": (r) => r.status === 200 });
  sleep(jitter(2, 5));  // simulates user reading the page before saving

  // ── 5a. Forge save via stress endpoint (Postgres JSONB read+write) ─────────
  // Real-data round-trip: reads the character blob from DB and writes it back.
  // Replace with the server action block below once you have the Next-Action ID.
  res = http.post(`${BASE_URL}/api/stress/characters/${characterId}/save`, null);
  check(res, { "forge save 200": (r) => r.status === 200 });

  // ── 5b. Forge save via real server action (uncomment after extracting hash) ─
  const saveBody = JSON.stringify([{ identity: { name: `K6 Stress Tester ${slot}` } }]);
  res = http.post(`${BASE_URL}/forge/${characterId}`, saveBody, {
    headers: {
      "Content-Type": "text/plain;charset=UTF-8",
      "Next-Action": '70fa93a807a5d85730e8982f0f6cbb4b9d83798064',
    },
  });
  check(res, { "forge save (action) 200": (r) => r.status === 200 });

  sleep(jitter(1, 3));

  // ── 6. Canvas page shell ──────────────────────────────────────────────────
  res = http.get(`${BASE_URL}/canvas/${characterId}`);
  check(res, { "canvas page 200": (r) => r.status === 200 });
  sleep(jitter(1, 3));
}
