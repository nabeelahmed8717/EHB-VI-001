/**
 * Register JPS as a platform with PSS.
 *
 * Run once after PSS is up:
 *   npx ts-node -r tsconfig-paths/register apps/jps-api/src/scripts/register-with-pss.ts
 *
 * This creates a platform record in PSS and prints the generated platform key.
 * Copy the key into .env as PSS_PLATFORM_KEY.
 */

import axios from 'axios';

const PSS_API_URL = process.env.PSS_API_URL ?? 'http://localhost:3001/api';
const PSS_ADMIN_KEY = process.env.PSS_ADMIN_KEY ?? 'changeme-admin-key';

async function main() {
  console.log(`Registering JPS with PSS at ${PSS_API_URL}...`);

  const res = await axios.post(
    `${PSS_API_URL}/platforms`,
    {
      platform_id: 'jps',
      platform_name: 'JPS — Job Providing Service',
      webhook_url: process.env.JPS_WEBHOOK_URL ?? 'http://localhost:3006/webhooks/pss',
      webhook_secret: process.env.PSS_WEBHOOK_SECRET ?? 'whsec_jps_dev',
    },
    { headers: { 'x-admin-key': PSS_ADMIN_KEY } },
  );

  console.log('✓ JPS registered with PSS');
  console.log(`  platform_key: ${String(res.data?.platform_key)}`);
  console.log('  → Copy this into .env as PSS_PLATFORM_KEY');
}

main().catch((err) => {
  console.error('Registration failed:', err?.response?.data ?? String(err));
  process.exit(1);
});
