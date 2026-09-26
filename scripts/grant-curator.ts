/**
 * grant-curator.ts — make an account a registry curator.
 *
 * The bootstrap problem: `registry.curator` is written by admins, and until
 * there is one admin there is nobody who can write it. `/admin` deliberately
 * offers no way out of that, because a bootstrap any signed-in account could
 * run is not a bootstrap. So the first one is created with the service key,
 * from here, by whoever holds it.
 *
 * The row is the grant. There is no claim on the JWT and no flag on the user,
 * so granting and revoking are both writes that can be read back — which is the
 * same reason the catalog keeps a revision trail.
 *
 *   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \
 *     pnpm tsx scripts/grant-curator.ts you@example.com --role admin --write
 *
 * Without --write it reports what it would do. `--role admin` also grants the
 * right to change the roster; plain `curator` can author but not appoint.
 * `--revoke` removes the row.
 */
const email = process.argv[2];
const write = process.argv.includes('--write');
const revoke = process.argv.includes('--revoke');
const roleArg = process.argv.indexOf('--role');
const role = roleArg > -1 ? process.argv[roleArg + 1] : 'curator';

function fail(msg: string): never {
  console.error(`grant-curator: ${msg}`);
  process.exit(1);
}

if (!email || email.startsWith('--'))
  fail('usage: grant-curator.ts <email> [--role admin] [--write] [--revoke]');
if (role !== 'curator' && role !== 'admin') fail(`--role must be curator or admin, got "${role}"`);

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) fail('needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');

const auth = { apikey: key, Authorization: `Bearer ${key}` };

async function main(): Promise<void> {
  // Look the account up rather than taking a uuid on the command line: pasting
  // the wrong uuid grants the wrong person, and nothing downstream would notice.
  const res = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1000`, { headers: auth });
  if (!res.ok) fail(`listing users: ${res.status} ${await res.text()}`);
  const { users } = (await res.json()) as { users: Array<{ id: string; email?: string }> };
  const found = users.filter((u) => u.email?.toLowerCase() === email!.toLowerCase());
  if (found.length === 0) {
    fail(
      `no account with the email ${email}. Sign in once with that address first — ` +
        'this grants a role to an existing account, it does not create one.',
    );
  }
  if (found.length > 1) fail(`${found.length} accounts share that email; resolve by hand`);
  const user = found[0]!;

  console.log(`${revoke ? 'revoking' : `granting ${role}`} · ${email} · ${user.id}`);
  if (!write) {
    console.log('(dry run — pass --write to apply)');
    return;
  }

  const target = `${url}/rest/v1/curator`;
  const headers = { ...auth, 'Content-Type': 'application/json', 'Content-Profile': 'registry' };
  const out = revoke
    ? await fetch(`${target}?user_id=eq.${user.id}`, { method: 'DELETE', headers })
    : await fetch(`${target}?on_conflict=user_id`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({
          user_id: user.id,
          role,
          note: `granted from scripts/grant-curator.ts for ${email}`,
        }),
      });
  if (!out.ok) fail(`${revoke ? 'revoke' : 'grant'}: ${out.status} ${await out.text()}`);
  console.log(revoke ? 'revoked.' : 'granted.');
}

main().catch((e: unknown) => fail(e instanceof Error ? e.message : String(e)));
