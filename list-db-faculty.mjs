import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const all = await p.faculty.findMany({ select: { slug: true, name: true, designation: true } });
all.forEach(f => console.log(`${f.slug}|${f.name}|${f.designation}`));
await p.$disconnect();
