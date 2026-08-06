/* One-shot verifier: row counts + 1 sample row per table + super-admin
 * sanity check. Idempotent, read-only. Useful after seed or migration.
 *
 *   npx tsx scripts/verify-seed.ts
 */
import { prisma } from '../src/lib/db';

function divider(label: string) {
  console.log(`\n══ ${label} ` + '═'.repeat(Math.max(0, 60 - label.length)));
}

async function main() {
  divider('Row counts');
  const counts = {
    department_identity: await prisma.departmentIdentity.count(),
    university_identity: await prisma.universityIdentity.count(),
    program:             await prisma.program.count(),
    research_area:       await prisma.researchArea.count(),
    user:                await prisma.user.count(),
    session:             await prisma.session.count(),
    account:             await prisma.account.count(),
  };
  console.table(counts);

  divider('department_identity (sample)');
  console.log(await prisma.departmentIdentity.findFirst());

  divider('university_identity (sample)');
  const uni = await prisma.universityIdentity.findFirst();
  console.log(uni);

  divider('program (first row by displayOrder)');
  console.log(await prisma.program.findFirst({ orderBy: { displayOrder: 'asc' } }));

  divider('research_area (first row by displayOrder)');
  console.log(await prisma.researchArea.findFirst({ orderBy: { displayOrder: 'asc' } }));

  divider('Super-admin row + linked credential account');
  const sa = await prisma.user.findFirst({
    where: { role: 'super_admin' },
    include: { accounts: { select: { providerId: true, accountId: true, password: true } } },
  });
  if (!sa) {
    console.error('✗ No super-admin found — bootstrap failed?');
    process.exit(1);
  }
  console.log({
    id: sa.id,
    email: sa.email,
    name: sa.name,
    role: sa.role,
    isActive: sa.isActive,
    lastLoginAt: sa.lastLoginAt,
    accounts: sa.accounts.map((a) => ({
      providerId: a.providerId,
      accountId: a.accountId,
      passwordHashedPrefix: a.password ? a.password.slice(0, 7) + '…' : null,
      passwordLength: a.password?.length ?? 0,
    })),
  });

  divider('Safety-rule precheck (super_admin count)');
  const superAdminCount = await prisma.user.count({
    where: { role: 'super_admin', isActive: true },
  });
  console.log(`Active super_admins: ${superAdminCount} (must always be ≥ 1)`);

  console.log('\n✓ Verification complete.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
