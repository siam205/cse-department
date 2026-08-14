import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const groups = {
  UsefulLink: p.footerUsefulLink,
  GetInTouchLink: p.footerGetInTouchLink,
  QuickLink: p.footerQuickLink,
  LegalLink: p.footerLegalLink,
  CampusLink: p.footerCampusLink,
};

for (const [label, model] of Object.entries(groups)) {
  const rows = await model.findMany({ orderBy: { displayOrder: 'asc' } });
  console.log(`\n=== ${label} ===`);
  for (const r of rows) {
    console.log(
      `${r.isDisabled ? '[DISABLED]' : '[ok]      '} ${r.name.padEnd(22)} href=${JSON.stringify(r.href)} ext=${r.isExternal}`,
    );
  }
}

await p.$disconnect();
