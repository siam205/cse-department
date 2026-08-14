/* Seed content tables + bootstrap the first super-admin.
 *
 * Idempotent: re-running upserts singletons, skips duplicate research
 * areas, and skips super-admin bootstrap if any user already exists.
 *
 * Required env at run time:
 *   DATABASE_URL
 *   INITIAL_SUPER_ADMIN_EMAIL
 *   INITIAL_SUPER_ADMIN_PASSWORD
 */
import bcrypt from 'bcryptjs';
import type { Prisma } from '@prisma/client';
import { prisma } from '../src/lib/db';
import { faculty as facultyData } from '../src/lib/faculty-data';
import { labs as labsData } from '../src/lib/labs-data';
import { news as newsData } from '../src/lib/news-data';
import { events as eventsData } from '../src/lib/events-data';
import { notices as noticesData } from '../src/lib/notices-data';
import { galleryImages as galleryData } from '../src/lib/gallery-data';
import { alumni as alumniData } from '../src/lib/alumni-data';
import { clubs as clubsData } from '../src/lib/clubs-data';
import { faqs as faqData } from '../src/lib/faq-data';
import { visitors as visitorsData } from '../src/lib/visitors-data';
import { researchPapers as researchPapersData } from '../src/lib/research-data';
import { busRoutes as busRoutesData } from '../src/lib/transport-data';

const BCRYPT_ROUNDS = 12;

async function seedDepartmentIdentity() {
  await prisma.departmentIdentity.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      name: 'Department of Computer Science & Engineering',
      shortCode: 'ME',
      facultyName: 'Faculty of Science & Engineering',
      primaryColor: '#2B3175',
      accentColor: '#CC1579',
      buttonColor: '#F8BD23',
      logoUrl: '/assets/su-colour-logo.webp',
      logoPublicId: null,
      breadcrumbLabel: 'ME',
      heroImage1Url: '/assets/hero-1.webp',
      heroImage1PublicId: null,
      heroImage2Url: '/assets/hero-2.webp',
      heroImage2PublicId: null,
      heroImage3Url: '/assets/hero-3.webp',
      heroImage3PublicId: null,
    },
  });
  console.log('✓ Department identity seeded');
}

async function seedUniversityIdentity() {
  await prisma.universityIdentity.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      name: 'Sonargaon University',
      address: '147/I, Green Road, Panthapath, Tejgaon, Dhaka',
      phones: ['+8801775000888', '+880241010352'],
      emails: ['info@su.edu.bd'],
      facebookUrl: 'https://www.facebook.com/SonargaonUniversity',
      instagramUrl: 'https://www.instagram.com/sonargaonuniversitybd/',
      youtubeUrl: 'https://www.youtube.com/@SonargaonUniversityEdu',
      linkedinUrl: 'https://www.linkedin.com/school/14451954/',
      xUrl: 'https://x.com/SonargaonUni',
      tiktokUrl: 'https://www.tiktok.com/@sonargaonuniversityedu',
      whatsappUrl: null,
      threadsUrl: 'https://www.threads.com/@sonargaonuniversitybd',
      erpUrl: 'http://sue.su.edu.bd:5081/sonargaon_erp/',
      applyUrl:
        'http://sue.su.edu.bd:5081/sonargaon_erp/siteadmin/admission_info',
      libraryUrl: 'http://lib.su.edu.bd',
      iqacUrl: 'https://su.edu.bd/iqac',
      careerUrl: 'https://su.edu.bd/welcome/career',
      noticeUrl: 'https://su.edu.bd/welcome/notice',
      copyrightText:
        'Copyright © 2026 All Rights Reserved by Sonargaon University',
      mapEmbedUrl:
        'https://maps.google.com/maps?q=Sonargaon%20University%20Panthapath%20Dhaka&hl=en&z=15&output=embed',
      logoUrl: '/assets/footer-logo.webp',
      logoPublicId: null,
      // Phase 9 — contact form recipient. Null = email delivery
      // disabled. Admin sets in /admin/university-identity once
      // Resend domain or sender is configured.
      contactSubmissionEmail: null,
    },
  });
  console.log('✓ University identity seeded');
}

async function seedPrograms() {
  await prisma.program.upsert({
    where: { degreeCode: 'BSc-CSE' },
    update: {},
    create: {
      programName: 'Undergraduate — B.Sc in Computer Science & Engineering',
      degreeCode: 'BSc-CSE',
      duration: '4 Years · 12 Semesters',
      description:
        'Our flagship undergraduate program builds a strong foundation in computer science and engineering — combining programming, software development, algorithms, databases, networking, artificial intelligence, and hands-on projects that prepare graduates for industry, entrepreneurship, research, and global postgraduate study.',
      displayOrder: 1,
      imageUrl: '/assets/program-undergraduate.webp',
      imagePublicId: null,
      specializations: [
        'Software Engineering',
        'AI & Machine Learning',
        'Cybersecurity',
        'Web & App Development',
      ],
      cta: 'View More',
      ctaHref: '/programs/bsc-cse',
    },
  });
  console.log('✓ Programs seeded');
}

async function seedProgramCourseStructure() {
  const program = await prisma.program.findUnique({ where: { degreeCode: 'BSc-CSE' } });
  if (!program) {
    console.log('⚠ BSc-CSE program not found; skipping course structure seed');
    return;
  }
  const count = await prisma.programCourseStructure.count({ where: { programId: program.id } });
  if (count > 0) {
    console.log('✓ Program course structure already seeded');
    return;
  }
  // Placeholder only — this is a code/feature port, not a content
  // pass. Real course structure (career prospects text + per-semester
  // course lists + credit distribution) needs a real curriculum
  // source and should be added via /admin/programs/[id]/course-structure
  // once that's available, same as it was for the Textile department.
  await prisma.programCourseStructure.create({
    data: {
      programId: program.id,
      careerProspectsHeading: 'Career Prospects',
      careerProspectsBody:
        '<p>Add this program’s career prospects here via /admin/programs/[id]/course-structure.</p>',
      semesters: [] as unknown as Prisma.InputJsonValue,
      pdfUrl: null,
      pdfPublicId: null,
      pdfFileName: null,
    },
  });
  console.log('✓ Program course structure seeded (placeholder — add real content via admin panel)');
}

async function seedResearchAreas() {
  // Count-gated like the other multi-row tables — only seeds these
  // defaults into a genuinely empty table. Never re-inserts once any
  // row exists, so admin-curated areas (added/renamed/deleted via
  // /admin/research-areas) are never overwritten or resurrected by a
  // later `db:seed` run. NOTE: these are still the original
  // Mechanical-era placeholder topics — replacing them with real CSE
  // research areas is a separate content pass, not part of this fix.
  const count = await prisma.researchArea.count();
  if (count > 0) {
    console.log(`✓ Research areas already seeded (${count} rows)`);
    return;
  }

  const areas = [
    { iconName: 'Flame',  areaName: 'Thermodynamics & Heat Transfer',   displayOrder: 1 },
    { iconName: 'Waves',  areaName: 'Fluid Mechanics & CFD',            displayOrder: 2 },
    { iconName: 'Bot',    areaName: 'Robotics & Automation',            displayOrder: 3 },
    { iconName: 'Wrench', areaName: 'Manufacturing & Production',       displayOrder: 4 },
    { iconName: 'Layers', areaName: 'Materials Science & Engineering',  displayOrder: 5 },
    { iconName: 'Leaf',   areaName: 'Renewable Energy Systems',         displayOrder: 6 },
    { iconName: 'Car',    areaName: 'Automotive Engineering',           displayOrder: 7 },
  ];

  await prisma.researchArea.createMany({ data: areas });
  console.log(`✓ Research areas seeded (${areas.length} new)`);
}

async function bootstrapSuperAdmin() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log(`✓ Super-admin bootstrap skipped — ${userCount} user(s) already exist`);
    return;
  }

  const email = process.env.INITIAL_SUPER_ADMIN_EMAIL;
  const password = process.env.INITIAL_SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'No users exist and INITIAL_SUPER_ADMIN_EMAIL / INITIAL_SUPER_ADMIN_PASSWORD are not set. Cannot bootstrap super-admin.',
    );
  }

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name: 'Super Admin',
      role: 'super_admin',
      isActive: true,
    },
  });

  // Better Auth convention for credentials provider:
  //   account.providerId = "credential", account.accountId = user.id
  await prisma.account.create({
    data: {
      userId: user.id,
      providerId: 'credential',
      accountId: user.id,
      password: hash,
    },
  });

  console.log(`✓ Super-admin bootstrapped: ${email}`);
}

// ─────────────────────────────────────────────────────────────────
//  Faculty seed — 41 rows from src/lib/faculty-data.ts, plus Dean
//  and Head message extras extracted from the about pages.
// ─────────────────────────────────────────────────────────────────

const DEAN_SLUG = 'habibur-rahman-kamal';
const HEAD_SLUG = 'mostofa-hossain';

// Inline <strong class="text-button-yellow">…</strong> preserved per
// J1 (raw HTML, super_admin-trusted, rendered via
// dangerouslySetInnerHTML in the message component). No drop-cap
// span here — that's render-side per J2.
const DEAN_MESSAGE_PARAGRAPHS = [
  'Welcome to the Department of Mechanical Engineering, the largest and most established department within the Faculty of Science and Engineering. Over the last decade, we have built a strong reputation for academic excellence, supported by a dedicated team of nearly 50 full-time faculty members from top-tier institutions like <strong class="text-button-yellow">BUET, KUET, and RUET</strong>.',
  'Our mission is to bridge the gap between creativity and technology by providing a modern learning environment equipped with high-tech laboratories and air-conditioned, multimedia classrooms. We pride ourselves on the global success of our graduates, many of whom are currently excelling in postgraduate programs across the USA, Canada, and the EU with prestigious scholarships.',
  'Beyond the classroom, our students consistently demonstrate their practical expertise, as evidenced by the recent recognition of the <strong class="text-button-yellow">Sonargaon University Mecha Club</strong> at the BUET Auto Fest. We are committed to fostering your growth as a skilled engineer and a responsible citizen, prepared to solve the complex technological challenges of the future.',
];

const HEAD_MESSAGE_PARAGRAPHS = [
  'Mechanical Engineering is the largest department of the university. The Department started its journey in the year of 2013 and has already passed a decade. In the last decade, we have developed our expertise and competency in curriculum and research. Our main goal is to provide quality education in both theory and practical to the undergraduate students, so that they can build their foundation strongly. There are about 50 (Fifty) highly educated, qualified and experienced permanent full-time faculty members from BUET, KUET, RUET, CUET, DUET, IUT, DU, CU, RU, JU and other public universities engaged in the Department. A large number of our graduates are regularly getting enrolments in Post-graduate programs in reputed universities around the world, particularly in the USA, Canada, Australia and the EU with prestigious scholarships, as well as a good number of faculty members are also on study leave in different countries pursuing their higher education.',
  'The university is located in the heart of the city, with easy access to Metro-Rail Station, City and Inter-district bus services. It provides free bus services around the city and downtown — Mograpara, Gauchhia, Kadamtali in the east, Abdullahpur in the north and Savar in the west.',
  '50% to 100% Waiver on tuition fees and scholarship is also available on the basis of semester results. Air-conditioned classrooms with multimedia projectors, lab facilities equipped with all types of equipments and machineries as per courses of the department, as well as Computer Lab with the latest and updated computers and software are also available in the Department.',
  'It is noteworthy that efficient and experienced professors of BUET have been appointed as advisors to the department. Students have participated in different competitive events and have kept the signatures of many accomplishments.',
  'ACI Motors Ltd. presents Auto Fest 2024 was held from February 01, 2024 to February 08, 2024, organized by Mechanical Engineering Association, BUET. Sonargaon University Mecha Club (SUMEC) of the Department of Mechanical Engineering participated in this Fest and achieved a token of appreciation as <strong class="text-button-yellow">Valuable Club Partner</strong>. Participation, collaboration and contribution of SUMEC significantly enriched the initiatives of the Fest.',
  'Therefore, Welcome to the Department of Mechanical Engineering — pursue your undergraduate degree and make yourself an Engineer as well as a good citizen to serve the country.',
];

// TS source uses hyphenated literal types; Prisma enum uses underscores.
function mapFacultyType(t: 'leadership' | 'full-time' | 'part-time') {
  if (t === 'leadership') return 'leadership' as const;
  if (t === 'full-time') return 'full_time' as const;
  return 'part_time' as const;
}

async function seedFaculty() {
  const before = await prisma.faculty.count();

  for (let i = 0; i < facultyData.length; i++) {
    const f = facultyData[i];
    const isDean = f.slug === DEAN_SLUG;
    const isHead = f.slug === HEAD_SLUG;

    const messageFields = isDean
      ? {
          isDean: true,
          messageOverline: 'A Note from the Dean',
          messageHeading: 'Welcome Message',
          messageParagraphs: DEAN_MESSAGE_PARAGRAPHS,
          messagePhotoUrl: '/assets/faculty-dean-kamal.webp',
          messageTitleLine1: 'Dean',
          messageTitleLine2: 'Faculty of Science & Engineering',
          messageHeroImageUrl: '/assets/mission-vision-hero.webp',
          messageHeroImageVerticalPercent: 3,
        }
      : isHead
        ? {
            isHead: true,
            messageOverline: 'A Note from the Head',
            messageHeading: 'Welcome Message',
            messageParagraphs: HEAD_MESSAGE_PARAGRAPHS,
            // Head's-message page uses a different photo than Head's
            // [slug] page — see J-finding in CP2.1 surface.
            messagePhotoUrl: '/assets/head-mostofa-hossain.webp',
            messageTitleLine1: 'Head of the Department',
            messageTitleLine2: 'Department of Mechanical Engineering',
            messageHeroImageUrl: '/assets/message-from-head-hero.webp',
            messageHeroImageVerticalPercent: 0,
          }
        : {};

    await prisma.faculty.upsert({
      where: { slug: f.slug },
      // Idempotent: re-running won't override admin edits to existing rows
      update: {},
      create: {
        slug:           f.slug,
        name:           f.name,
        designation:    f.designation,
        secondaryTitle: f.secondaryTitle ?? null,
        badge:          f.badge ?? null,
        type:           mapFacultyType(f.type),
        displayOrder:   i,
        photoUrl:       f.photo ?? null,
        email:          f.email ?? null,
        phone:          f.phone ?? null,
        suId:           f.suId ?? null,
        // Json columns — source values are typed as the loose union
        // (string | string[] | { heading; items }[]) which TS can't
        // narrow to Prisma's InputJsonValue without a cast. The cast
        // is honest about the runtime contract (we know these are
        // JSON-serializable) and replaces the prior misleading
        // `as object | undefined` (string isn't an object).
        personalInfo:          (f.personalInfo          ?? undefined) as Prisma.InputJsonValue | undefined,
        academicQualification: (f.academicQualification ?? undefined) as Prisma.InputJsonValue | undefined,
        trainingExperience:    (f.trainingExperience    ?? undefined) as Prisma.InputJsonValue | undefined,
        teachingArea:          (f.teachingArea          ?? undefined) as Prisma.InputJsonValue | undefined,
        publications:          (f.publications          ?? undefined) as Prisma.InputJsonValue | undefined,
        research:              (f.research              ?? undefined) as Prisma.InputJsonValue | undefined,
        awards:                (f.awards                ?? undefined) as Prisma.InputJsonValue | undefined,
        membership:            (f.membership            ?? undefined) as Prisma.InputJsonValue | undefined,
        previousEmployment:    (f.previousEmployment    ?? undefined) as Prisma.InputJsonValue | undefined,
        ...messageFields,
      },
    });
  }

  const after = await prisma.faculty.count();
  console.log(`✓ Faculty seeded (before: ${before}, after: ${after}, created: ${after - before})`);
}

// ════════════════════════════════════════════════════════════════
//  PHASE 3 — chrome structure (backfills + chrome tables)
//  Pattern: backfill null fields on existing singletons, bulk insert
//  on empty new tables. Never overwrites admin-edited values.
// ════════════════════════════════════════════════════════════════

async function backfillDepartmentIdentityAlts() {
  const row = await prisma.departmentIdentity.findUnique({ where: { id: 'singleton' } });
  if (!row) return;
  const heroAlts = [
    'Sonargaon University Mechanical Engineering Department',
    'Sonargaon University Mechanical Engineering students and faculty',
    'Sonargaon University Mechanical Engineering campus',
  ];
  const updates: Record<string, string> = {};
  if (!row.heroImage1Alt) updates.heroImage1Alt = heroAlts[0];
  if (!row.heroImage2Alt) updates.heroImage2Alt = heroAlts[1];
  if (!row.heroImage3Alt) updates.heroImage3Alt = heroAlts[2];
  if (Object.keys(updates).length) {
    await prisma.departmentIdentity.update({ where: { id: 'singleton' }, data: updates });
    console.log(`✓ Department identity hero alts backfilled (${Object.keys(updates).length} fields)`);
  } else {
    console.log('✓ Department identity hero alts already populated');
  }
}

async function backfillFeaturedResearchArea() {
  // Promote "Robotics & Automation" to isFeatured=true and populate
  // featured-card content from the previously hardcoded block in
  // MajorResearchSection.tsx. areaName stays unchanged (grid card
  // visual identical); featuredHeading carries the longer card title.
  const existingFeatured = await prisma.researchArea.findFirst({ where: { isFeatured: true } });
  if (existingFeatured) {
    console.log(`✓ Featured research area already set (${existingFeatured.areaName})`);
    return;
  }
  const target = await prisma.researchArea.findFirst({ where: { areaName: 'Robotics & Automation' } });
  if (!target) {
    console.log('⚠ Robotics & Automation row not found; skipping featured backfill');
    return;
  }
  await prisma.researchArea.update({
    where: { id: target.id },
    data: {
      isFeatured: true,
      featuredHeading: 'Robotics & Industrial Automation',
      featuredImageUrl: '/assets/research-featured.webp',
      featuredImagePublicId: null,
      featuredDescription:
        'This research cell operates at the intersection of mechanical design and intelligent control, building autonomous systems for next-generation manufacturing...',
      featuredCtaHref: '/research',
    },
  });
  console.log('✓ Featured research area set (Robotics & Automation → featured)');
}

async function seedTopLinks() {
  const count = await prisma.topLink.count();
  if (count > 0) {
    console.log(`✓ Top links already seeded (${count} rows)`);
    return;
  }
  const rows = [
    { name: 'Virtual Tour',  href: null,                                  isExternal: false, isDisabled: true,  displayOrder: 1 },
    { name: 'IQAC',          href: 'https://su.edu.bd/iqac',              isExternal: true,  isDisabled: false, displayOrder: 2 },
    { name: 'Career',        href: 'https://su.edu.bd/welcome/career',    isExternal: true,  isDisabled: false, displayOrder: 3 },
    { name: 'Archive',       href: null,                                  isExternal: false, isDisabled: true,  displayOrder: 4 },
    { name: 'Contact',       href: '/contact',                            isExternal: false, isDisabled: false, displayOrder: 5 },
  ];
  await prisma.topLink.createMany({ data: rows });
  console.log(`✓ Top links seeded (${rows.length} rows)`);
}

async function seedQuickAccessItems() {
  const count = await prisma.quickAccessItem.count();
  if (count > 0) {
    console.log(`✓ Quick access items already seeded (${count} rows)`);
    return;
  }
  const rows = [
    { name: 'Library',       href: 'http://lib.su.edu.bd',                                                            iconName: 'BookOpen',       isExternal: true,  isDisabled: false, displayOrder: 1  },
    { name: 'Admission',     href: '/admission/requirements',                                                         iconName: 'GraduationCap',  isExternal: false, isDisabled: false, displayOrder: 2  },
    { name: 'Photo',         href: '/gallery',                                                                        iconName: 'Image',          isExternal: false, isDisabled: false, displayOrder: 3  },
    { name: 'Virtual Tour',  href: null,                                                                              iconName: 'Compass',        isExternal: false, isDisabled: true,  displayOrder: 4  },
    { name: 'Archive',       href: null,                                                                              iconName: 'Archive',        isExternal: false, isDisabled: true,  displayOrder: 5  },
    { name: 'Notice',        href: 'https://su.edu.bd/welcome/notice',                                                iconName: 'Users',          isExternal: true,  isDisabled: false, displayOrder: 6  },
    { name: 'ERP',           href: 'http://sue.su.edu.bd:5081/sonargaon_erp/',                                        iconName: 'Globe',          isExternal: true,  isDisabled: false, displayOrder: 7  },
    { name: 'IQAC',          href: 'https://su.edu.bd/iqac',                                                          iconName: 'ClipboardList',  isExternal: true,  isDisabled: false, displayOrder: 8  },
    { name: 'Skill Jobs',    href: 'https://su.edu.bd/welcome/career',                                                iconName: 'Building2',      isExternal: true,  isDisabled: false, displayOrder: 9  },
    { name: 'Convoc. Reg.',  href: 'http://sue.su.edu.bd:5081/sonargaon_erp/student/convocation_registration',       iconName: 'Award',          isExternal: true,  isDisabled: false, displayOrder: 10 },
    { name: 'Verification',  href: 'https://su.edu.bd/welcome/degree_verification',                                   iconName: 'CheckCircle',    isExternal: true,  isDisabled: false, displayOrder: 11 },
  ];
  await prisma.quickAccessItem.createMany({ data: rows });
  console.log(`✓ Quick access items seeded (${rows.length} rows)`);
}

async function seedMainNav() {
  const count = await prisma.mainNavGroup.count();
  if (count > 0) {
    console.log(`✓ Main nav already seeded (${count} groups)`);
    return;
  }
  // Read the current applyUrl from UniversityIdentity so the seeded
  // "Apply Online" item carries the live value at seed time. Admin
  // edits to UniversityIdentity.applyUrl after seed don't auto-sync
  // here — they must update both places. See CP3.1 commit message.
  const universityIdentity = await prisma.universityIdentity.findUnique({ where: { id: 'singleton' } });
  const applyUrl = universityIdentity?.applyUrl ?? 'http://sue.su.edu.bd:5081/sonargaon_erp/siteadmin/admission_info';

  const groups = [
    {
      name: 'About', href: null, hasDropdown: true, title: 'About', displayOrder: 1,
      items: [
        { name: 'Message from Head',   href: '/about/message-from-head',   displayOrder: 1 },
        { name: 'Mission & Vision',    href: '/about/mission-vision',      displayOrder: 2 },
        { name: 'Laboratory Facility', href: '/about/laboratory-facility', displayOrder: 3 },
        { name: 'Lab Facility',        href: '/about/lab-facility',        displayOrder: 4 },
        { name: 'Department Layout',   href: '/about/department-layout',  displayOrder: 5 },
      ],
    },
    {
      name: 'Faculty Member', href: '/faculty-member', hasDropdown: false, title: null, displayOrder: 2,
      items: [],
    },
    {
      name: 'Admission', href: null, hasDropdown: true, title: 'Admission', displayOrder: 3,
      items: [
        { name: 'Admission Requirements', href: '/admission/requirements',       displayOrder: 1 },
        { name: 'Tuition Fees',           href: '/admission/tuition-fees',       displayOrder: 2 },
        { name: 'Transfer Credits',       href: '/admission/transfer-credits',   displayOrder: 3 },
        { name: 'Waiver & Scholarship',   href: '/admission/waiver-scholarship', displayOrder: 4 },
        { name: 'Admission Notice',       href: '/admission/notice',             displayOrder: 5 },
        { name: 'Prospectus',             href: '/admission/prospectus',         displayOrder: 6 },
        { name: 'Apply Online',           href: applyUrl, isExternal: true,      displayOrder: 7 },
      ],
    },
    {
      name: 'Student Society', href: null, hasDropdown: true, title: 'Student Society', displayOrder: 4,
      items: [
        { name: 'Notice Board', href: '/student-society/notice-board', displayOrder: 1 },
        { name: 'Events',       href: '/student-society/events',       displayOrder: 2 },
        { name: 'Alumni',       href: '/student-society/alumni',       displayOrder: 3 },
        { name: 'Visitor',      href: '/student-society/visitor',      displayOrder: 4 },
        { name: 'FAQ',          href: '/student-society/faq',          displayOrder: 5 },
        { name: 'Syllabus',     href: '/student-society/syllabus',     displayOrder: 6 },
        { name: 'Club list',    href: '/student-society/club-list',    displayOrder: 7 },
        { name: 'SU Programming Club', href: '/about/programming-club', displayOrder: 8 },
      ],
    },
    {
      name: 'Contact', href: '/contact', hasDropdown: false, title: null, displayOrder: 5,
      items: [],
    },
  ];

  let totalItems = 0;
  for (const g of groups) {
    const { items, ...groupData } = g;
    const created = await prisma.mainNavGroup.create({ data: groupData });
    if (items.length) {
      await prisma.mainNavItem.createMany({
        data: items.map(i => ({
          groupId: created.id,
          name: i.name,
          href: i.href,
          isExternal: i.isExternal ?? false,
          isDisabled: false,
          displayOrder: i.displayOrder,
        })),
      });
      totalItems += items.length;
    }
  }
  console.log(`✓ Main nav seeded (${groups.length} groups, ${totalItems} items)`);
}

async function seedFooterUsefulLinks() {
  const count = await prisma.footerUsefulLink.count();
  if (count > 0) {
    console.log(`✓ Footer useful links already seeded (${count} rows)`);
    return;
  }
  const rows = [
    { name: 'Tuition Fee',   href: '/admission/tuition-fees',           isExternal: false, isDisabled: false, displayOrder: 1 },
    { name: 'Faculty Staff', href: '/faculty-member',                   isExternal: false, isDisabled: false, displayOrder: 2 },
    { name: 'Alumni',        href: '/student-society/alumni',           isExternal: false, isDisabled: false, displayOrder: 3 },
    { name: 'Career',        href: 'https://su.edu.bd/welcome/career',  isExternal: true,  isDisabled: false, displayOrder: 4 },
    { name: 'Event',         href: '/student-society/events',           isExternal: false, isDisabled: false, displayOrder: 5 },
    { name: 'Our Blogs',     href: null,                                isExternal: false, isDisabled: true,  displayOrder: 6 },
  ];
  await prisma.footerUsefulLink.createMany({ data: rows });
  console.log(`✓ Footer useful links seeded (${rows.length} rows)`);
}

async function seedFooterGetInTouchLinks() {
  const count = await prisma.footerGetInTouchLink.count();
  if (count > 0) {
    console.log(`✓ Footer get-in-touch links already seeded (${count} rows)`);
    return;
  }
  const rows = [
    { name: 'Contact',           href: '/contact',                                        isExternal: false, isDisabled: false, displayOrder: 1 },
    { name: 'Meet With Us',      href: '/contact',                                        isExternal: false, isDisabled: false, displayOrder: 2 },
    // Phase 17 — same rename as FooterLegalLink so the label is
    // consistent across both footer columns.
    { name: 'Privacy Policy',    href: '/privacy-policy',                                 isExternal: false, isDisabled: false, displayOrder: 3 },
    { name: 'Newsletters',       href: null,                                              isExternal: false, isDisabled: true,  displayOrder: 4 },
    { name: 'Location Map',      href: '/contact',                                        isExternal: false, isDisabled: false, displayOrder: 5 },
    { name: 'FAQ',               href: '/student-society/faq',                            isExternal: false, isDisabled: false, displayOrder: 6 },
  ];
  await prisma.footerGetInTouchLink.createMany({ data: rows });
  console.log(`✓ Footer get-in-touch links seeded (${rows.length} rows)`);
}

async function seedFooterQuickLinks() {
  const count = await prisma.footerQuickLink.count();
  if (count > 0) {
    console.log(`✓ Footer quick links already seeded (${count} rows)`);
    return;
  }
  const rows = [
    { name: 'SU News',        href: '/news',                                                  isExternal: false, isDisabled: false, displayOrder: 1 },
    { name: 'Forum',          href: null,                                                     isExternal: false, isDisabled: true,  displayOrder: 2 },
    { name: 'Students',       href: null,                                                     isExternal: false, isDisabled: true,  displayOrder: 3 },
    { name: 'Parents',        href: null,                                                     isExternal: false, isDisabled: true,  displayOrder: 4 },
    { name: 'Teachers',       href: 'https://su.edu.bd/faculty_members/all_faculty_details', isExternal: true,  isDisabled: false, displayOrder: 5 },
    { name: 'Administration', href: 'https://su.edu.bd/About_us/new_administration/4',       isExternal: true,  isDisabled: false, displayOrder: 6 },
  ];
  await prisma.footerQuickLink.createMany({ data: rows });
  console.log(`✓ Footer quick links seeded (${rows.length} rows)`);
}

async function seedFooterLegalLinks() {
  const count = await prisma.footerLegalLink.count();
  if (count > 0) {
    console.log(`✓ Footer legal links already seeded (${count} rows)`);
    return;
  }
  const rows = [
    // Phase 17 — rename + relink to the new internal Legal Pages CMS
    // (Privacy Policy / Terms & Conditions). Existing chair-edited
    // values are not overwritten by seed (this block only runs when
    // the table is empty).
    { name: 'Privacy Policy',     href: '/privacy-policy',        isExternal: false, isDisabled: false, displayOrder: 1 },
    { name: 'Terms & Conditions', href: '/terms-and-conditions',  isExternal: false, isDisabled: false, displayOrder: 2 },
    { name: 'Sitemap',            href: '/sitemap.xml',           isExternal: false, isDisabled: false, displayOrder: 3 },
  ];
  await prisma.footerLegalLink.createMany({ data: rows });
  console.log(`✓ Footer legal links seeded (${rows.length} rows)`);
}

// ════════════════════════════════════════════════════════════════
//  PHASE 4 — About pages (3 singleton models)
//  Pattern: upsert with update={} so re-running never overwrites
//  admin edits to existing rows; create path populates from the
//  pre-Phase-4 hardcoded page content.
// ════════════════════════════════════════════════════════════════

async function seedAboutOverview() {
  await prisma.aboutOverview.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      heroTitle:         'Department Overview',
      heroSubtitle:      'Shaping future leaders where creativity meets technology.',
      heroOverline:      null,
      heroImageUrl:      '/assets/mission-vision-hero.webp',
      heroImagePublicId: null,
      heroImageVerticalPercent: 3,
      paragraphs: [
        'At the heart of innovation and excellence, the Department of Mechanical Engineering is committed to shaping future leaders in the field. Explore the dynamic world of mechanical engineering, where creativity meets technology, and where ideas transform into groundbreaking solutions.',
        'At the Department of Mechanical Engineering, we strive to shape the future of engineering by providing cutting-edge education and research opportunities. With a focus on interdisciplinary collaboration and real-world applications, our department prepares students to tackle complex challenges and contribute to the advancement of technology and society.',
        'The main responsibility of the Department of Mechanical Engineering is to design, analyze, test, and manufacture machines and equipment. Mechanical Engineering is a vast and heterogeneous field in respect of the different types of products that the engineers work on, the industry in which they work, and the knowledge they need to become successful.',
        'The Mechanical Engineers, who are interested in pursuing a career, have the attributes such as: the idea of what Mechanical Engineers work on, the function that Mechanical Engineers fulfill, the type of work environment, and the industries that they serve. Mechanical engineers are involved in a comprehensive variety of products like aircraft, automobile vehicles, industrial equipment and machinery, engines, turbines, pumps, mechanical handling systems, heating and cooling systems, consumer devices, and so on.',
      ],
    },
  });
  console.log('✓ AboutOverview seeded');
}

async function seedAboutMissionVision() {
  await prisma.aboutMissionVision.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      heroTitle:         'Mission & Vision',
      heroOverline:      'About',
      heroImageUrl:      '/assets/mission-vision-hero.webp',
      heroImagePublicId: null,
      heroImageVerticalPercent: 3,

      missionOverline: 'Our Purpose',
      missionHeading:  'Mission',
      missionBody:
        'The mission of the Department is to provide knowledge to students in science and technology through world-class education and innovative research, empower innovators, shape the future, and provide a transformative learning experience that nurtures creativity, instills a strong foundation of knowledge, and equips students with the skills to address global challenges through cutting-edge mechanical engineering solutions — so that they are able to contribute impactfully to society, the nation and the world, and to develop the professional potential and skill of faculty, staff and students by maintaining training and education by which they can achieve lifelong ability to construct their professional careers.',

      visionOverline: 'Our Future',
      visionHeading:  'Vision',
      visionBody:
        'Through the active participation of its people, the Department of Mechanical Engineering will be acknowledged as a leader of its discipline, illustrating quality education, research and innovation. With quality education and research, the department will be enabled to create skilled and well-qualified engineers to meet the continually changing technological, regional and national needs.',
    },
  });
  console.log('✓ AboutMissionVision seeded');
}

async function seedAboutMechaClub() {
  await prisma.aboutMechaClub.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      heroTitle:         'SU Mecha Club',
      heroOverline:      'About',
      heroImageUrl:      '/assets/mecha-hero.webp',
      heroImagePublicId: null,
      heroImageVerticalPercent: 45,

      introOverline: 'Where Engineering Meets Community',
      // Inline HTML preserved — gradient on "Mechanical Engineers"
      introHeading:
        'Building Industry-Ready <span class="text-gradient">Mechanical Engineers</span>',
      introBody1:
        'The Mechanical Engineering department at Sonargaon University fosters a vibrant student community through its dedicated club and organisational activities. We focus on transforming students into industry-ready professionals through continuous engagement and practical exposure.',
      introBody2:
        'From plant visits to international software training, the SU Mecha Club bridges classroom learning with the real world — equipping every member with the skills, network, and confidence to lead.',
      introImageUrl:      '/assets/mecha-club-1.webp',
      introImagePublicId: null,

      stats: [
        { value: '100+', label: 'Active Members' },
        { value: '50+',  label: 'Field Visits' },
        { value: '25+',  label: 'Workshops Hosted' },
        { value: '10+',  label: 'Industry Partners' },
      ],

      activitiesOverline: 'What We Do',
      activitiesHeading:  'Core Activities & Initiatives',
      activities: [
        {
          iconName: 'Factory',
          imageUrl: '/assets/mecha-field-visit.webp',
          imagePublicId: null,
          category: 'Industrial Exposure',
          title: 'Field Visits to Leading Plants',
          description:
            'Regularly organised industrial tours to power plants, textile machinery units and large-scale manufacturing facilities — giving students a firsthand look at real mechanical operations and management.',
        },
        {
          iconName: 'Laptop',
          imageUrl: '/assets/mecha-workshop.webp',
          imagePublicId: null,
          category: 'Skill Development',
          title: 'Hands-on Software Workshops',
          description:
            'Specialized training sessions on industry-standard engineering software including AutoCAD and SolidWorks, ensuring students are proficient in digital design before they graduate.',
        },
        {
          iconName: 'Mic',
          imageUrl: '/assets/mecha-seminar.webp',
          imagePublicId: null,
          category: 'Career Guidance',
          title: 'Seminars with Industry Experts',
          description:
            'Frequent seminars featuring industry leaders and corporate experts that provide insights into local and international job markets — manufacturing, energy, and the public sector.',
        },
        {
          iconName: 'Lightbulb',
          imageUrl: '/assets/mecha-project.webp',
          imagePublicId: null,
          category: 'Innovation',
          title: 'Project Showcases & Tech Fairs',
          description:
            'Students display engineering prototypes and innovative solutions during university-wide tech fairs and departmental exhibitions, sharpening their presentation and engineering skills.',
        },
        {
          iconName: 'Sparkles',
          imageUrl: '/assets/mecha-cocurricular.webp',
          imagePublicId: null,
          category: 'Community',
          title: 'Co-curricular Engagement',
          description:
            'Beyond technical skills — indoor games, cultural programs and study tours that foster a well-rounded university experience and strong bonding between batches.',
        },
        {
          iconName: 'Award',
          imageUrl: '/assets/mecha-appreciation.webp',
          imagePublicId: null,
          category: 'Recognition',
          title: 'Awards & Industry Recognition',
          description:
            'SUMEC was honoured as a Valuable Club Partner at ACI Motors-presented Auto Fest 2024 (organised by ME Association, BUET) — one of many recognitions earned through active participation, collaboration, and engineering excellence.',
        },
      ],

      networkOverline:          'Beyond Graduation',
      networkHeading:           'Building a Professional Network',
      networkBody:
        'The Mecha Club community serves as a bridge between current students and the SU Alumni — creating an active professional network that opens doors to internships, job placements, and lifelong mentorship across the engineering industry.',
      networkPrimaryCtaLabel:   'Join the Club',
      networkPrimaryCtaHref:    'https://www.facebook.com/su.mechanical.engineering',
      networkSecondaryCtaLabel: 'Alumni Portal',
      networkSecondaryCtaHref:
        'http://sue.su.edu.bd:5081/sonargaon_erp/student/convocation_registration/alumni',
    },
  });
  console.log('✓ AboutMechaClub seeded');
}

// ════════════════════════════════════════════════════════════════
//  PHASE 5 — Lab systems (4 models: 2 singletons + 2 multi-row)
//  Pattern: upsert with update={} on singletons, bulk-insert-when-
//  empty on multi-row tables (idempotent, admin edits survive).
// ════════════════════════════════════════════════════════════════

async function seedLabFacilityLanding() {
  await prisma.labFacilityLanding.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      heroTitle:         'Lab Facilities',
      heroOverline:      'About',
      heroImageUrl:      '/assets/lab-hero.webp',
      heroImagePublicId: null,
      heroImageVerticalPercent: 25,
      introBody:
        'The Department of Mechanical Engineering provides international-standard education through a combination of theory and hands-on practical sessions. Our specialised laboratories are equipped with modern machinery and tools to prepare students for the global engineering market.',
    },
  });
  console.log('✓ LabFacilityLanding seeded');
}

async function seedLabs() {
  const count = await prisma.lab.count();
  if (count > 0) {
    console.log(`✓ Labs already seeded (${count} rows)`);
    return;
  }
  // Source: src/lib/labs-data.ts. galleryPublicIds is empty for
  // seed (local /assets/ paths have no Cloudinary id); admin
  // upload paths populate both arrays in parallel.
  let inserted = 0;
  for (let i = 0; i < labsData.length; i++) {
    const lab = labsData[i];
    await prisma.lab.create({
      data: {
        slug:              lab.slug,
        name:              lab.name,
        tagline:           lab.tagline,
        description:       lab.description,
        heroImageUrl:      lab.heroImage ?? null,
        heroImagePublicId: null,
        gallery:           lab.gallery ?? [],
        galleryPublicIds:  [],
        displayOrder:      i,
      },
    });
    inserted += 1;
  }
  console.log(`✓ Labs seeded (${inserted} rows)`);
}

async function seedLaboratoryFacilityLanding() {
  await prisma.laboratoryFacilityLanding.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      heroTitle:         'Laboratory Facility',
      heroOverline:      'About',
      heroImageUrl:      '/assets/lab-hero.webp',
      heroImagePublicId: null,
      heroImageVerticalPercent: 25,
      introBody:
        'The Department of Mechanical Engineering at Sonargaon University is committed to excellence in hands-on technical education. Our laboratories serve as the hub for innovation, where students apply complex thermodynamic, fluidic, and structural theories to real-world engineering challenges.',
      featuresOverline: 'What Sets Us Apart',
      featuresHeading:  'Why Our Labs Matter',
      // Source: features const in laboratory-facility/page.tsx.
      // Icon component refs mapped to Lucide name strings:
      //   Cog → "Cog"
      //   ShieldCheck → "ShieldCheck"
      //   FlaskConical → "FlaskConical"
      features: [
        {
          iconName: 'Cog',
          title: 'Industry-Standard Equipment',
          description: 'Access to machinery used in modern manufacturing and power plants.',
        },
        {
          iconName: 'ShieldCheck',
          title: 'Safety-First Environment',
          description: 'All labs are managed by expert technicians ensuring a secure learning environment.',
        },
        {
          iconName: 'FlaskConical',
          title: 'Research Driven',
          description: 'Facilities support senior design projects (Capstone) and faculty-led research in renewable energy and robotics.',
        },
      ],
    },
  });
  console.log('✓ LaboratoryFacilityLanding seeded');
}

async function seedLaboratoryLabs() {
  const count = await prisma.laboratoryLab.count();
  if (count > 0) {
    console.log(`✓ LaboratoryLabs already seeded (${count} rows)`);
    return;
  }
  // Source: labs const in laboratory-facility/page.tsx. iconName
  // mapped from Icon component refs (Flame → "Flame", etc.).
  // keyItems stored as plain string (Discovery #2 — preserved as
  // single comma-separated sentence to match current visual).
  const rows = [
    {
      iconName: 'Flame',
      title: 'Applied Thermodynamics & Heat Engine Laboratory',
      description:
        'Dedicated to the study of energy conversion and thermal systems. Students explore the mechanics of power generation and the operational cycles of various engines.',
      keyLabel: 'Key Equipment',
      keyItems:
        'Multi-cylinder petrol and diesel engines, steam generator models, and bomb calorimeters.',
      focus:
        'Internal Combustion (IC) engine performance, thermal efficiency, and combustion analysis.',
      displayOrder: 0,
    },
    {
      iconName: 'Droplets',
      title: 'Fluid Mechanics & Hydraulic Machinery Lab',
      description:
        'Fluid dynamics is essential to everything from piping systems to aerospace. This lab provides the tools to measure and analyze the behaviour of liquids and gases.',
      keyLabel: 'Key Equipment',
      keyItems:
        "Bernoulli's theorem apparatus, Orifice meters, Venturi meters, and centrifugal pump test rigs.",
      focus:
        'Flow measurement, pressure drops, and the operational characteristics of hydraulic turbines.',
      displayOrder: 1,
    },
    {
      iconName: 'Wrench',
      title: 'Central Machine Shop & Manufacturing Lab',
      description:
        'A cornerstone of the department, the Machine Shop provides a rigorous introduction to industrial manufacturing processes and precision engineering.',
      keyLabel: 'Key Equipment',
      keyItems:
        'Industrial-grade Lathe machines, Milling machines, Shaper machines, and Radial drilling machines.',
      focus:
        'Precision machining, tool geometry, and metal fabrication techniques.',
      displayOrder: 2,
    },
    {
      iconName: 'Hammer',
      title: 'Mechanics of Materials Lab',
      description:
        'Ensuring structural integrity is a primary duty of a mechanical engineer. This lab allows students to test the physical limits of engineering materials.',
      keyLabel: 'Key Equipment',
      keyItems:
        'Universal Testing Machine (UTM), Torsion testing machine, and Rockwell/Brinell Hardness testers.',
      focus:
        'Stress-strain analysis, tensile strength, elasticity, and material fatigue.',
      displayOrder: 3,
    },
    {
      iconName: 'PenTool',
      title: 'Engineering Drawing & CAD/CAM Studio',
      description:
        'Bridging the gap between concept and reality, our computing studio is equipped with industry-standard software for modern design.',
      keyLabel: 'Key Software',
      keyItems: 'AutoCAD, SolidWorks, and ANSYS.',
      focus:
        '2D technical drafting, 3D solid modelling, and Finite Element Analysis (FEA).',
      displayOrder: 4,
    },
    {
      iconName: 'Zap',
      title: 'Welding & Metal Joining Laboratory',
      description:
        'This lab focuses on the metallurgy and techniques of joining materials — essential for heavy industry and structural construction.',
      keyLabel: 'Key Processes',
      keyItems:
        'Electric Arc welding, Oxy-Acetylene gas welding, and TIG/MIG welding setups.',
      focus:
        'Weld pool dynamics, structural bonding, and safety protocols in fabrication.',
      displayOrder: 5,
    },
  ];
  await prisma.laboratoryLab.createMany({ data: rows });
  console.log(`✓ LaboratoryLabs seeded (${rows.length} rows)`);
}

// ════════════════════════════════════════════════════════════════
//  PHASE 6 — Content hubs (News, Events, Notices, Gallery)
//  Pattern: bulk insert when empty (idempotent). News/Notices use
//  isoDate as publishedAt + raw `date` string as displayDate.
//  Events parse the free-form `date` field where possible; null
//  date events keep eventDate=null with displayDate populated.
// ════════════════════════════════════════════════════════════════

const MONTH_PREFIXES = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

// Parse the legacy free-form Event date string into a DateTime if
// possible. Returns null for unparseable shapes (e.g. "2024", "20 Apr").
function parseLooseEventDate(displayDate: string | null): Date | null {
  if (!displayDate) return null;
  const m = /^(\d{1,2})\s+([A-Za-z]+)(?:,\s*(\d{4}))?$/.exec(displayDate.trim());
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const monIdx = MONTH_PREFIXES.findIndex((mn) => m[2].toLowerCase().startsWith(mn));
  const year = m[3] ? parseInt(m[3], 10) : null;
  if (monIdx < 0 || year === null) return null;
  return new Date(Date.UTC(year, monIdx, day));
}

async function seedNews() {
  const count = await prisma.news.count();
  if (count > 0) {
    console.log(`✓ News already seeded (${count} rows)`);
    return;
  }
  // Source: src/lib/news-data.ts. isoDate parses cleanly; the
  // formatted `date` string is preserved as displayDate so the
  // public render is byte-identical until admin edits.
  for (const n of newsData) {
    await prisma.news.create({
      data: {
        slug:          n.slug,
        title:         n.title,
        shortTitle:    n.shortTitle,
        category:      n.category,
        publishedAt:   new Date(n.isoDate),
        displayDate:   n.date,
        summary:       n.summary,
        coverUrl:      n.cover,
        coverPublicId: null,
        // Imported typed arrays — TS won't widen the specific shape
        // ({label,value}[]) to Prisma's InputJsonObject signature
        // without a unknown bounce. Runtime values are JSON-safe.
        body:          n.body as unknown as Prisma.InputJsonValue,
        meta:          (n.meta ?? []) as unknown as Prisma.InputJsonValue,
      },
    });
  }
  console.log(`✓ News seeded (${newsData.length} rows)`);
}

async function seedEvents() {
  const count = await prisma.event.count();
  if (count > 0) {
    console.log(`✓ Events already seeded (${count} rows)`);
    return;
  }
  // Source: src/lib/events-data.ts. Best-effort date parse; rows
  // with unparseable (or null) dates keep eventDate=null and rely
  // on displayDate for the date pill. status preserved as-is.
  for (const e of eventsData) {
    await prisma.event.create({
      data: {
        slug:          e.slug,
        title:         e.title,
        shortTitle:    e.shortTitle,
        category:      e.category,
        status:        e.status,
        eventDate:     parseLooseEventDate(e.date),
        displayDate:   e.date,
        time:          e.time ?? null,
        venue:         e.venue ?? null,
        imageUrl:      e.image,
        imagePublicId: null,
        summary:       e.summary,
        description:   e.description as unknown as Prisma.InputJsonValue,
        focus:         e.focus,
        details:       (e.details ?? []) as unknown as Prisma.InputJsonValue,
        ctaLabel:      e.cta?.label ?? null,
        ctaHref:       e.cta?.href ?? null,
        ctaExternal:   e.cta?.external ?? false,
      },
    });
  }
  console.log(`✓ Events seeded (${eventsData.length} rows)`);
}

async function seedNotices() {
  const count = await prisma.notice.count();
  if (count > 0) {
    console.log(`✓ Notices already seeded (${count} rows)`);
    return;
  }
  // Source: src/lib/notices-data.ts. fileUrl points at the existing
  // /assets/notices/<slug>.<ext> so live notices keep working until
  // admin re-uploads; filePublicId=null marks them as not-yet-on-
  // Cloudinary (replacing one via admin will populate it).
  for (const n of noticesData) {
    await prisma.notice.create({
      data: {
        slug:         n.slug,
        title:        n.title,
        category:     n.category,
        department:   n.department,
        publishedAt:  new Date(n.isoDate),
        displayDate:  n.date,
        description:  n.description,
        fileUrl:      n.file,
        filePublicId: null,
        fileType:     n.fileType,
        fileName:     n.file.split('/').pop() ?? null,
      },
    });
  }
  console.log(`✓ Notices seeded (${noticesData.length} rows)`);
}

async function seedGalleryImages() {
  const count = await prisma.galleryImage.count();
  if (count > 0) {
    console.log(`✓ Gallery images already seeded (${count} rows)`);
    return;
  }
  // Source: src/lib/gallery-data.ts (programmatically generated
  // from a 27-entry dimensions array). Flat list per Decision A —
  // no albums. imagePublicId=null until admin re-uploads.
  for (let i = 0; i < galleryData.length; i++) {
    const g = galleryData[i];
    await prisma.galleryImage.create({
      data: {
        imageUrl:      g.src,
        imagePublicId: null,
        alt:           g.alt,
        width:         g.width,
        height:        g.height,
        displayOrder:  i,
      },
    });
  }
  console.log(`✓ Gallery images seeded (${galleryData.length} rows)`);
}

// ════════════════════════════════════════════════════════════════
//  PHASE 7 — Student Society + Transport (final CMS migration)
//  Pattern: count-gated bulk insert (idempotent — re-running won't
//  duplicate). Source data preserved verbatim from each *-data.ts
//  file so visual identity is byte-equivalent post-seed.
// ════════════════════════════════════════════════════════════════

async function seedAlumni() {
  const count = await prisma.alumni.count();
  if (count > 0) {
    console.log(`✓ Alumni already seeded (${count} rows)`);
    return;
  }
  for (let i = 0; i < alumniData.length; i++) {
    const a = alumniData[i];
    await prisma.alumni.create({
      data: {
        slug:          a.id,
        studentId:     a.studentId,
        name:          a.name,
        department:    a.department,
        designation:   a.designation,
        company:       a.company,
        photoUrl:      a.photo,
        photoPublicId: null,
        displayOrder:  i,
      },
    });
  }
  console.log(`✓ Alumni seeded (${alumniData.length} rows)`);
}

async function seedClubs() {
  const count = await prisma.club.count();
  if (count > 0) {
    console.log(`✓ Clubs already seeded (${count} rows)`);
    return;
  }
  for (let i = 0; i < clubsData.length; i++) {
    const c = clubsData[i];
    await prisma.club.create({
      data: {
        slug:          c.id,
        name:          c.name,
        abbreviation:  c.abbreviation,
        description:   c.description,
        imageUrl:      c.image,
        imagePublicId: null,
        displayOrder:  i,
      },
    });
  }
  console.log(`✓ Clubs seeded (${clubsData.length} rows)`);
}

async function seedFaqs() {
  const count = await prisma.faq.count();
  if (count > 0) {
    console.log(`✓ FAQs already seeded (${count} rows)`);
    return;
  }
  // displayOrder by source array index; the legacy `id: number` field
  // (1-33) was sequential anyway, so this preserves the rendered order.
  for (let i = 0; i < faqData.length; i++) {
    const q = faqData[i];
    await prisma.faq.create({
      data: {
        category:     q.category,
        question:     q.question,
        answer:       q.answer,
        displayOrder: i,
      },
    });
  }
  console.log(`✓ FAQs seeded (${faqData.length} rows)`);
}

async function seedVisitors() {
  const count = await prisma.visitor.count();
  if (count > 0) {
    console.log(`✓ Visitors already seeded (${count} rows)`);
    return;
  }
  for (let i = 0; i < visitorsData.length; i++) {
    const v = visitorsData[i];
    await prisma.visitor.create({
      data: {
        slug:          v.id,
        name:          v.name,
        role:          v.role ?? null,
        affiliation:   v.affiliation ?? null,
        photoUrl:      v.photo,
        photoPublicId: null,
        quote:         v.quote as unknown as Prisma.InputJsonValue,
        displayOrder:  i,
      },
    });
  }
  console.log(`✓ Visitors seeded (${visitorsData.length} rows)`);
}

// Best-effort 4-digit year parse from the free-form `date` field.
// Source data has shapes like "14 August 2019", "January–February 2023",
// "September 2022", "" (empty). Returns null when no 4-digit number found.
function parseYearFromDate(date: string | null | undefined): number | null {
  if (!date) return null;
  const m = /(\d{4})/.exec(date);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) && n >= 1900 && n <= 2100 ? n : null;
}

async function seedResearchPapers() {
  const count = await prisma.researchPaper.count();
  if (count > 0) {
    console.log(`✓ Research papers already seeded (${count} rows)`);
    return;
  }
  for (let i = 0; i < researchPapersData.length; i++) {
    const p = researchPapersData[i];
    await prisma.researchPaper.create({
      data: {
        title:           p.title,
        authors:         p.authors,
        area:            p.area,
        date:            p.date && p.date.length > 0 ? p.date : null,
        publicationYear: parseYearFromDate(p.date),
        displayOrder:    i,
      },
    });
  }
  console.log(`✓ Research papers seeded (${researchPapersData.length} rows)`);
}

async function seedBusRoutes() {
  const count = await prisma.busRoute.count();
  if (count > 0) {
    console.log(`✓ Bus routes already seeded (${count} rows)`);
    return;
  }
  for (let i = 0; i < busRoutesData.length; i++) {
    const r = busRoutesData[i];
    await prisma.busRoute.create({
      data: {
        slug:           r.id,
        routeName:      r.routeName,
        busNumber:      r.busNumber,
        contact:        r.contact,
        departureTimes: r.departureTimes,
        returnTimes:    r.returnTimes,
        displayOrder:   i,
      },
    });
  }
  console.log(`✓ Bus routes seeded (${busRoutesData.length} rows)`);
}

async function seedSyllabus() {
  const count = await prisma.syllabus.count();
  if (count > 0) {
    console.log(`✓ Syllabus already seeded (${count} rows)`);
    return;
  }
  // Source: inline const in src/app/student-society/syllabus/page.tsx
  // (Postgraduate entry intentionally absent — page renders "coming soon"
  // empty state when level filter = Postgraduate).
  await prisma.syllabus.create({
    data: {
      slug:          'bsc-cse',
      title:         'B.Sc. in Computer Science & Engineering',
      shortTitle:    'B. Sc. in Computer Science & Engineering',
      department:    'Computer Science & Engineering',
      level:         'Undergraduate',
      coverUrl:      '/assets/syllabus-me-cover.webp',
      coverPublicId: null,
      pdfUrl:        '/assets/syllabus-me.pdf',
      pdfPublicId:   null,
      pdfFileName:   'syllabus-me.pdf',
      summary:
        'Detailed course-by-course syllabus covering the four-year B.Sc. programme — Thermal Engineering, Design & Manufacturing, Automotive Engineering, Robotics & Automation, Materials Science, and Renewable Energy Systems.',
      displayOrder:  0,
    },
  });
  console.log('✓ Syllabus seeded (1 row)');
}

async function seedTransportLanding() {
  // Source: hardcoded JSX in src/app/transport-service/page.tsx —
  // the chrome that wraps the busRoutes grid (intro paragraph,
  // gradient banner, 3-row "Important Instructions" card).
  await prisma.transportLanding.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      introBody:
        'Sonargaon University (SU) provides a comprehensive bus service covering major routes to ensure a comfortable commute for our students and staff.',
      bannerHeading: 'Free University Bus Service',
      // HTML allowed — preserves the yellow-highlight pattern from
      // the legacy render. Same author-trust caveat as Phase 2/4/6.
      bannerBody:
        'The university provides free bus services covering major city areas and outskirts — <strong class="text-button-yellow">Mograpara</strong>, <strong class="text-button-yellow">Gauchhia</strong>, <strong class="text-button-yellow">Kadamtali</strong>, <strong class="text-button-yellow">Abdullahpur</strong>, and <strong class="text-button-yellow">Savar</strong>.',
      // Shape matches Phase 5 LaboratoryFacility `features` so the
      // FeaturesEditor admin component is reused (constraint #4).
      instructions: [
        {
          iconName: 'MapPin',
          title: 'Pick-up Points',
          description: 'Please contact the respective bus drivers/supervisors at the provided numbers to confirm your specific pick-up location and exact time.',
        },
        {
          iconName: 'Sparkles',
          title: 'Special Service — Mohakhali',
          description: 'A dedicated bus leaves for Mohakhali from SU six days a week at <strong>08:00 AM</strong>. For details, contact: <a href="tel:01958642587">01958-642587</a>.',
        },
        {
          iconName: 'Bus',
          title: 'Free Service',
          description: 'The university provides free bus services covering major city areas and outskirts like Mograpara, Gauchhia, Kadamtali, Abdullahpur, and Savar.',
        },
      ] as unknown as Prisma.InputJsonValue,
    },
  });
  console.log('✓ TransportLanding seeded');
}

// ─────────────────────────────────────────────────────────────────
//  Phase 8a — Admission CMS Part 1 (Notices + Prospectus)
// ─────────────────────────────────────────────────────────────────

async function seedAdmissionNotice() {
  const slug = 'summer-2026-inauguration';
  const bodyParagraphs: string[] = [
    'By order of the university authority, this is to inform all Deans of Faculties, Heads of Departments, Coordinators, and Section / Office Heads that the Inauguration Ceremony of the <strong>Summer-2026 Admission Fair</strong> has been scheduled for <strong>tomorrow, March 06, 2026, at 04:00 PM</strong> at the 147/I, Green Road building of Sonargaon University.',
    'The ceremony will be presided over by the Honourable Vice-Chancellor (Acting) of the University, <strong>Professor Dr. Mohammad Ekramul Islam</strong>.',
    '<strong>Advocate Umme Salma</strong>, Honourable Member of the Board of Trustees, SU Trust, has kindly consented to grace the occasion as the <em>Chief Guest</em>. Additionally, the Honourable Advisor of Sonargaon University, <strong>Mr. Azizul Bari (Shipu)</strong>, will be present as the <em>Inaugurator</em> of the event.',
    '<strong>All concerned are requested to attend the inauguration ceremony at the scheduled time.</strong>',
  ];
  const ccList: string[] = [
    'Office of the Board of Trustees, SU Trust',
    'Office of the Vice-Chancellor',
    'Office of the Pro-Vice-Chancellor',
    'Office of the Treasurer',
    'Office File',
  ];

  const data = {
    slug,
    title: 'Attendance at the Inauguration Ceremony of the Summer-2026 Admission Fair',
    refNo: 'SU/Reg/Notice/2026/74',
    subject: 'Attendance at the Inauguration Ceremony of the Summer-2026 Admission Fair',
    publishedAt: new Date('2026-03-05T00:00:00Z'),
    displayDate: 'March 05, 2026',
    headerOverline: 'Office of the Registrar',
    bodyParagraphs: bodyParagraphs as unknown as Prisma.InputJsonValue,
    signatoryPreamble: 'By order of the Vice-Chancellor (Acting),',
    signatoryName: 'S. M. Nurul Huda',
    signatoryDesignation: 'Registrar',
    ccLabel: 'Copy for Kind Information (not according to seniority)',
    ccList: ccList as unknown as Prisma.InputJsonValue,
    heroImageUrl: '/assets/admission-hero.webp',
    heroImagePublicId: null,
    fileUrl: '/assets/admission-notice-summer-2026.pdf',
    filePublicId: null,
    fileName: 'SU-Admission-Notice-Summer-2026.pdf',
    isActive: true,
    displayOrder: 0,
  };

  await prisma.admissionNotice.upsert({
    where: { slug },
    create: data,
    // Idempotent: re-running won't override admin edits to an
    // existing row (matches the safe pattern used everywhere else in
    // this file — an unconditional `update: data` here previously
    // caused every `db:seed` run to silently reset admin-edited
    // content back to these hardcoded defaults).
    update: {},
  });
  console.log('✓ AdmissionNotice seeded (1 row)');
}

// ─────────────────────────────────────────────────────────────────
//  Phase 8b — Admission CMS Part 2 (Requirements + Tuition Fees)
// ─────────────────────────────────────────────────────────────────

async function seedAdmissionRequirements() {
  const intro =
    'Sonargaon University welcomes applications from students who meet the eligibility criteria below. Different programs have specific entry requirements — please review the section that applies to you.';

  const undergraduateRequirements: string[] = [
    'Minimum GPA of 2.5 (or second division) in SSC and HSC examinations (or their equivalent), or GCE/IGCSE "O" Level in four subjects.',
    '"A" Level in two subjects with minimum GPA of 2.50 in each exam (using scale of A=5, B=4, C=3, D=2, E=1), or average 450 marks in GED with five subjects.',
    'Minimum GPA of 2.0 in SSC and HSC examinations individually for Fashion Design and Technology.',
    'Equivalent performance under other educational systems (e.g. American High School Diploma, IB, etc.) is also accepted.',
    'A combined SAT score of 1100 is also accepted in lieu of the Admission Test for High School Graduates in any system.',
    'For admission to engineering programs, students must have studied Physics, Chemistry, and Mathematics in HSC / A-Level.',
    'The University also accepts non-degree admissions, usually for exchange students.',
    'Transfer of credits from comparable educational institutions may be considered after admission.',
  ];

  const additionalNotes: string[] = [
    'Students who have passed the HSC Examination under the mark-based grading system are considered for admission and scholarship at SU based on a conversion scale approved by the SU Admission Committee.',
    'Any confusion relating to a degree or diploma obtained from home or abroad — for admission to undergraduate / graduate programs or for other purposes — shall be referred to and resolved by the Degree Equivalence Committee of SU.',
  ];

  const diplomaRequirements: string[] = [
    'Three or four years Diploma in Engineering from Bangladesh Technical Education Board (BTEB) with a CGPA of 2.5 out of 4.00, OR',
    'A Diploma recognised by BTEB with a CGPA of 2.5 out of 4.00 in any engineering discipline from any recognised institute.',
  ];

  const combinedGpaBody =
    'Combined GPA of <strong class="text-primary">5.0 in SSC &amp; HSC</strong> with a minimum of 2.5 in each, OR a total GPA of <strong class="text-primary">6.00*</strong> with a minimum GPA of 2.00 in either SSC or HSC.';

  const diplomaQuickCriteria: { label: string; value: string }[] = [
    { label: 'SSC',     value: 'Minimum GPA 2.5' },
    { label: 'Diploma', value: 'Minimum GPA 2.5' },
  ];

  const data = {
    intro,
    undergraduateRequirements: undergraduateRequirements as unknown as Prisma.InputJsonValue,
    additionalNotes:           additionalNotes           as unknown as Prisma.InputJsonValue,
    diplomaRequirements:       diplomaRequirements       as unknown as Prisma.InputJsonValue,
    combinedGpaBody,
    diplomaQuickCriteria:      diplomaQuickCriteria      as unknown as Prisma.InputJsonValue,
  };

  await prisma.admissionRequirements.upsert({
    where:  { id: 'singleton' },
    create: { id: 'singleton', ...data },
    // Idempotent — see seedAdmissionNotice comment.
    update: {},
  });
  console.log('✓ AdmissionRequirements seeded (singleton)');
}

async function seedProgramFeeStructures() {
  // Lookup B.Sc. CSE by degreeCode (seeded as 'BSc-CSE' by seedPrograms).
  const program = await prisma.program.findUnique({ where: { degreeCode: 'BSc-CSE' } });
  if (!program) {
    console.log('⚠ Program BSc-CSE not found — skipping ProgramFeeStructure seed');
    return;
  }

  const overviewStats = [
    { iconName: 'GraduationCap', label: 'Total Credits',        value: '160' },
    { iconName: 'Calendar',      label: 'Semester System',      value: 'Tri-Semester' },
    { iconName: 'CreditCard',    label: 'Admission Fee',        value: 'BDT 12,500' },
    { iconName: 'Wallet',        label: 'Total Semester Fees',  value: 'BDT 96,000' },
  ];

  const shifts = [
    {
      iconName: 'Sun',
      name: 'SUN',
      shiftLabel: 'Morning Shift',
      description: 'Primarily for students from an SSC + HSC background.',
      groups: [
        {
          background: 'SSC + HSC',
          tiers: [
            { gpa: '5.00 – 8.99', perCredit: 975, total: 264500 },
            { gpa: '9.00 – 9.99', perCredit: 897, total: 252020 },
            { gpa: '10.00',       perCredit: 741, total: 227060 },
          ],
        },
      ],
    },
    {
      iconName: 'Moon',
      name: 'MOON',
      shiftLabel: 'Evening Shift',
      description: 'Available for both SSC + HSC and Diploma students.',
      groups: [
        {
          background: 'SSC + HSC',
          tiers: [
            { gpa: '5.00 – 7.99', perCredit: 1613, total: 342580 },
            { gpa: '8.00 – 9.00', perCredit: 1523, total: 328180 },
            { gpa: '10.00',       perCredit: 1434, total: 313940 },
          ],
        },
        {
          background: 'Diploma',
          tiers: [
            { gpa: '5.00 – 7.99', perCredit: 1410, total: 310772 },
            { gpa: '8.00 – 9.00', perCredit: 1332, total: 297812 },
          ],
        },
      ],
    },
    {
      iconName: 'Star',
      name: 'STAR',
      shiftLabel: 'Friday Shift',
      description: 'Available for both SSC + HSC and Diploma students.',
      groups: [
        {
          background: 'SSC + HSC',
          tiers: [
            { gpa: '5.00 – 7.99', perCredit: 940, total: 234900 },
            { gpa: '8.00 – 9.00', perCredit: 846, total: 219860 },
            { gpa: '10.00',       perCredit: 705, total: 197300 },
          ],
        },
        {
          background: 'Diploma',
          tiers: [
            { gpa: '5.00 – 7.99', perCredit: 808, total: 213860 },
            { gpa: '8.00 – 9.00', perCredit: 723, total: 200324 },
          ],
        },
      ],
    },
  ];

  const policies = [
    {
      iconName: 'Award',
      title: 'Golden A+ Waiver',
      text: 'Students with a Golden A+ in both SSC and HSC receive a 100% Tuition Fee Waiver.',
    },
    {
      iconName: 'Percent',
      title: 'Payment Discounts',
      text: '10% waiver on tuition fees if the full 1st semester fee is paid at admission. 15% waiver on tuition fees if the full program fee is paid at admission.',
    },
    {
      iconName: 'Receipt',
      title: 'Additional Fees',
      text: 'A BDT 7,500 fee is charged for the Provisional Certificate (PVC) in the final semester.',
    },
  ];

  const data = {
    programId:     program.id,
    introOverline: 'B.Sc. in Computer Science & Engineering (CSE)',
    introHeading:  'Tuition Fee Structure',
    introBody:
      'Cost per credit and the total program cost vary based on your academic background (SSC + HSC or Diploma) and the shift you choose. Use the breakdown below to find the fees that apply to you.',
    overviewStats: overviewStats as unknown as Prisma.InputJsonValue,
    shifts:        shifts        as unknown as Prisma.InputJsonValue,
    policies:      policies      as unknown as Prisma.InputJsonValue,
    displayOrder:  0,
  };

  await prisma.programFeeStructure.upsert({
    where:  { programId: program.id },
    create: data,
    // Idempotent — see seedAdmissionNotice comment.
    update: {},
  });
  console.log(`✓ ProgramFeeStructure seeded (1 row — ${program.degreeCode})`);
}

async function seedProspectusEntries() {
  const rows = [
    {
      slug: 'bsc-cse',
      title: 'B.Sc. in Computer Science & Engineering',
      shortTitle: 'B. Sc. in Computer Science & Engineering',
      department: 'Computer Science & Engineering',
      level: 'Undergraduate',
      coverUrl: '/assets/prospectus-me-cover.webp',
      coverPublicId: null,
      pdfUrl: '/assets/prospectus-me.pdf',
      pdfPublicId: null,
      pdfFileName: 'prospectus-me.pdf',
      displayOrder: 0,
    },
  ];
  for (const row of rows) {
    await prisma.prospectusEntry.upsert({
      where: { slug: row.slug },
      create: row,
      // Idempotent — see seedAdmissionNotice comment.
      update: {},
    });
  }
  console.log(`✓ ProspectusEntry seeded (${rows.length} row${rows.length === 1 ? '' : 's'})`);
}

// ─────────────────────────────────────────────────────────────────
//  Phase 8c — Admission CMS Part 3 (Transfer Credits + Waiver/Scholarship)
// ─────────────────────────────────────────────────────────────────

async function seedAdmissionTransferCredits() {
  const minimumGradeBullets = [
    {
      heading: 'Standard Credit Transfer',
      body: "a minimum grade of <strong>'B'</strong> is required for a course to be accepted for transfer.",
    },
    {
      heading: 'Internal Migration',
      body: "a minimum grade of <strong>'D'</strong> is accepted for students migrating or changing departments within the university.",
    },
  ];

  const documents = [
    {
      title: 'Formal Application',
      description:
        'A prescribed application for "Credit Transfer Student(s)" addressed to the Registrar of SU.',
    },
    {
      title: 'Secondary Academic Records',
      description: 'Official copies of the SSC Transcript and the HSC or Diploma Transcript.',
    },
    {
      title: 'Higher Education Records',
      description:
        'Official transcripts from all previously attended universities — including all courses regardless of whether credit was earned (i.e. "Fail" or "Incomplete" grades).',
    },
    {
      title: 'Course Syllabi',
      description:
        'The syllabus for every course under consideration for transfer — technical and non-technical, departmental and non-departmental.',
    },
  ];

  const summaryRows = [
    { label: 'Maximum Credits Accepted', value: '50% of program total' },
    { label: 'Transfer Fee',             value: 'BDT 20,000' },
    { label: 'Standard Minimum Grade',   value: "'B'" },
    { label: 'Internal Migration Grade', value: "'D'" },
  ];

  const data = {
    intro:
      'Sonargaon University accepts credit transfers from other recognised institutions, as well as internal migrations between departments. Review the policy and required documents below before you apply.',
    minimumGradeBullets: minimumGradeBullets as unknown as Prisma.InputJsonValue,
    limitMaxLabel:    'Maximum Transfer Limit',
    limitMaxValue:    '50%',
    limitMaxSubtitle: "of the program's total credits",
    limitFeeLabel:    'Credit Transfer Fee',
    limitFeeValue:    'BDT 20,000',
    limitFeeSubtitle: 'one-time charge',
    documentsIntroText: 'Submit the following documents along with your application:',
    documents:          documents as unknown as Prisma.InputJsonValue,
    summaryKicker:  'Quick Reference',
    summaryHeading: 'Summary of Key Constraints',
    summaryRows:    summaryRows as unknown as Prisma.InputJsonValue,
  };

  await prisma.admissionTransferCredits.upsert({
    where:  { id: 'singleton' },
    create: { id: 'singleton', ...data },
    // Idempotent — see seedAdmissionNotice comment.
    update: {},
  });
  console.log('✓ AdmissionTransferCredits seeded (singleton)');
}

async function seedWaiverScholarshipLanding() {
  const summaryRows = [
    { category: 'Sibling / Spouse / Parent',      max: '10% per student', status: 'Active' },
    { category: 'Female Students',                max: '10% – 50%',       status: 'Active' },
    { category: 'Freedom Fighter Quota',          max: '100% (Tuition)',  status: 'Active' },
    { category: 'Disability Quota',               max: '10%',             status: 'Active' },
    { category: 'Group Waiver',                   max: '3% – 5%',         status: 'Active' },
    { category: 'Tribal / Instructor Quotas',     max: '10%',             status: 'Active' },
    { category: 'Special (Admission Fair)',       max: 'BDT 30,000',      status: 'Active' },
  ];

  const keyTakeaways = [
    'Maximum benefit: to receive the highest possible scholarship (50%), a student must take at least 15 credits and maintain a perfect 4.00 GPA.',
    'Incentive for higher load: even with the same GPA (e.g. 4.00), moving from Slab 1 to Slab 3 doubles the scholarship — from 25% to 50%.',
  ];

  const data = {
    intro:
      'Sonargaon University offers a range of tuition waivers and merit scholarships to make quality engineering education accessible. Eligibility depends on academic performance, demographic criteria, and family / institutional context.',
    part1Kicker:        'Part 01',
    part1Heading:       'Tuition Fee Waivers',
    summaryHeading:     'Summary Table',
    summarySubheading:  'Quick reference for all waiver categories.',
    summaryRows:        summaryRows as unknown as Prisma.InputJsonValue,
    summaryFooterNote:
      'for the general Student Welfare Division (SWD) Waiver on tuition fees, students must submit an application to the SWD department after their admission is complete.',
    part2Kicker:        'Part 02',
    part2Heading:       'Merit Scholarships',
    part2Intro:
      'The university offers three distinct scholarship slabs based on the number of credits a student completes in a semester. The scholarship percentage increases as the credit load and GPA increase.',
    keyTakeawaysKicker: 'Key Takeaways',
    keyTakeaways:       keyTakeaways as unknown as Prisma.InputJsonValue,
  };

  await prisma.waiverScholarshipLanding.upsert({
    where:  { id: 'singleton' },
    create: { id: 'singleton', ...data },
    // Idempotent — see seedAdmissionNotice comment.
    update: {},
  });
  console.log('✓ WaiverScholarshipLanding seeded (singleton)');
}

async function seedWaiverCategories() {
  const categories = [
    {
      slug: 'staff-dependent',
      iconName: 'Users',
      title: 'University Staff & Dependent Waivers',
      items: [
        { heading: 'SU Staff (Academic & Administrative)', text: 'If permitted by the Head of Department and the Syndicate, the staff member receives a waiver on the Admission Fee only.' },
        { heading: 'Staff Dependents',                     text: '100% waiver of total fees / total package.' },
        { heading: 'Staff Close Relatives',                text: 'Additional 10% waiver — limited to one student per semester and requires verification.' },
      ],
      note: 'Dependent waivers are cancelled if the staff member leaves SU permanently, but remain active if the staff member expires, suffers from a chronic disease, or is unable to work due to a major accident.',
      displayOrder: 0,
    },
    {
      slug: 'family-group',
      iconName: 'HeartHandshake',
      title: 'Family & Group Waivers',
      items: [
        { heading: 'Siblings / Spouse / Parent–Child',   text: '10% waiver per student once the final family member is admitted — 2 students: 20% total, 3 students: 30% total.' },
        { heading: 'Group Waiver — General Programs',    text: '3% waiver for groups of 2–4 people; 5% waiver for groups of 5 or more.' },
        { heading: 'Group Waiver — Specific Programs',   text: '5% waiver applies to groups of 2 or more students for Architecture, Naval Architecture, and Journalism.' },
      ],
      note: null,
      displayOrder: 1,
    },
    {
      slug: 'special-quotas',
      iconName: 'Award',
      title: 'Special Quotas & Demographic Waivers',
      items: [
        { heading: 'Freedom Fighter Quota', text: '100% waiver on tuition fees. If applicants exceed 3%, a lottery is held — limited to one student per family.' },
        { heading: 'Female Students',       text: '10% to 50% waiver on tuition fees upon proper application.' },
        { heading: 'Disability Quota',      text: '10% waiver — the university reserves the right to amend this for special cases.' },
        { heading: 'Tribal Quota',          text: '10% waiver.' },
        { heading: 'Instructor Quota',      text: '10% waiver.' },
      ],
      note: null,
      displayOrder: 2,
    },
    {
      slug: 'institutional-fair',
      iconName: 'Building2',
      title: 'Institutional & Fair Waivers',
      items: [
        { heading: 'SU Sister Concern Diploma Graduates (NIET, NPI, BIST)', text: 'Admission Fee: BDT 8,500 instead of the standard BDT 12,500 (BDT 4,000 waiver). Tuition fee includes a BDT 1,000 component.' },
        { heading: 'Admission Fair (Special Waiver)',                        text: 'BDT 20,000 or BDT 30,000 waiver on tuition fees during fair events.' },
      ],
      note: null,
      displayOrder: 3,
    },
  ];

  for (const cat of categories) {
    const data = {
      ...cat,
      items: cat.items as unknown as Prisma.InputJsonValue,
    };
    await prisma.waiverCategory.upsert({
      where:  { slug: cat.slug },
      create: data,
      // Idempotent — see seedAdmissionNotice comment.
      update: {},
    });
  }
  console.log(`✓ WaiverCategory seeded (${categories.length} rows)`);
}

async function seedScholarships() {
  const slabs = [
    { slug: 'slab-1', name: 'Slab 1', credits: '10 Credits or Fewer',   base: '2%',      perfect: '25%', near: '10%', isHighlight: false, displayOrder: 0 },
    { slug: 'slab-2', name: 'Slab 2', credits: '12 Credits or Fewer',   base: '5%',      perfect: '30%', near: '15%', isHighlight: false, displayOrder: 1 },
    { slug: 'slab-3', name: 'Slab 3', credits: '15 Credits or More',    base: 'Highest', perfect: '50%', near: '20%', isHighlight: true,  displayOrder: 2 },
  ];

  for (const slab of slabs) {
    await prisma.scholarship.upsert({
      where:  { slug: slab.slug },
      create: slab,
      // Idempotent — see seedAdmissionNotice comment.
      update: {},
    });
  }
  console.log(`✓ Scholarship seeded (${slabs.length} rows)`);
}

// ─────────────────────────────────────────────────────────────────
//  Phase 10 — Contact page content + Campus Locations
// ─────────────────────────────────────────────────────────────────

async function seedContactPageContent() {
  const quickContactCards = [
    {
      iconName: 'Phone',
      title: 'Phone',
      primaryValue: '+880 2 41010352',
      primaryHref: 'tel:+880241010352',
      hint: 'Sat–Fri, 8 AM – 8 PM',
    },
    {
      iconName: 'Mail',
      title: 'E-mail',
      primaryValue: 'admission.info@su.edu.bd',
      primaryHref: 'mailto:admission.info@su.edu.bd',
      secondaryValue: null,
      secondaryHref: null,
    },
    {
      iconName: 'Globe',
      title: 'Website',
      primaryValue: 'www.su.edu.bd',
      primaryHref: 'https://www.su.edu.bd',
    },
    {
      iconName: 'Facebook',
      title: 'Facebook',
      primaryValue: 'Sonargaon University',
      primaryHref: 'https://www.facebook.com/SonargaonUniversity',
    },
  ];

  const data = {
    heroTitle: 'Contact Us',
    heroOverline: 'Get in Touch',
    heroImageUrl: '/assets/contact-hero.webp',
    heroImagePublicId: null,
    heroImageVerticalPercent: 30,
    introBody:
      'We are here to assist you. Whether you have questions about admissions, academic programs, or campus facilities, feel free to reach out to us through any of the following channels.',
    quickContactHeading: 'Quick Contact Information',
    formHeading: 'Send Us a Message',
    formSubheading: "Have a question or suggestion? Fill out the form and we'll get back to you.",
    campusesHeading: 'Campus Locations',
    responseTimeNote: 'We typically respond within 1–2 business days.',
    quickContactCards: quickContactCards as unknown as Prisma.InputJsonValue,
  };

  await prisma.contactPageContent.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton', ...data },
  });
  console.log('✓ ContactPageContent seeded (singleton)');
}

async function seedCampusLocations() {
  const campuses = [
    {
      slug: 'permanent',
      name: 'Permanent Campus',
      tag: null,
      address: 'Ward No–75, Dasher Kandi, Khilgaon, Dhaka-1219',
      phone: null,
      email: 'info@su.edu.bd',
      displayOrder: 0,
    },
    {
      slug: 'green-road',
      name: 'Green Road Campus',
      tag: 'City Campus-1',
      address: '147/I, Green Road, Panthapath, Dhaka-1215',
      phone: '+880241010352',
      email: null,
      displayOrder: 1,
    },
    {
      slug: 'mohakhali',
      name: 'Mohakhali Campus',
      tag: 'City Campus-2',
      address: 'GP Ja-146, Wireless Gate, Mohakhali, Dhaka-1212',
      phone: '+880241020135',
      email: 'info@su.edu.bd',
      displayOrder: 2,
    },
  ];

  for (const c of campuses) {
    await prisma.campusLocation.upsert({
      where: { slug: c.slug },
      create: c,
      // Idempotent — see seedAdmissionNotice comment.
      update: {},
    });
  }
  console.log(`✓ CampusLocation seeded (${campuses.length} rows)`);
}

// ─────────────────────────────────────────────────────────────────
//  Phase 12 — JourneyCTAContent (chrome section between content +
//    footer). Seeded from the previously hardcoded JourneyCTASection.
// ─────────────────────────────────────────────────────────────────

async function seedJourneyCTAContent() {
  await prisma.journeyCTAContent.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      heroImageUrl: '/assets/journey-cta.webp',
      heroImagePublicId: null,
      heroImageVerticalPercent: 32,
      heading: 'Shape Your Future with Excellence',
      body: 'Join a vibrant academic community where innovation, leadership, and lifelong learning shape your path to success.',
      primaryCtaLabel: 'Apply Now',
      primaryCtaHref: 'http://sue.su.edu.bd:5081/sonargaon_erp/siteadmin/admission_info',
      primaryCtaExternal: true,
      secondaryCtaLabel: 'Request for Information',
      secondaryCtaHref: '/contact',
      secondaryCtaExternal: false,
    },
  });
  console.log('✓ JourneyCTAContent seeded (singleton)');
}

// ─────────────────────────────────────────────────────────────────
//  Phase 17 — LegalPagesContent (Privacy Policy + Terms & Conditions)
//    Two pages, one combined singleton. Bodies stored as structured
//    sections — each section is { heading?, paragraphs[] } — rendered
//    on the public side as <h2> + <p> blocks. Admin edits via
//    SectionsEditor (prose only, no HTML markup).
// ─────────────────────────────────────────────────────────────────

const PRIVACY_SECTIONS = [
  {
    paragraphs: [
      'Thank you for visiting Sonargaon University (SU) website. This website is the official website of Sonargaon University owned and operated by Sonargaon University. Sonargaon University is comprised of Institutes, Schools, Departments, Offices, Units and Activities, all of which may have individual representation on the web. Sonargaon University does not collect your personal information when you visit one of our websites unless you choose to provide that information to us. Sonargaon University does not sell, exchange, or release your personal information to outside parties without your consent. Once we obtain your consent, we consider it valid until revoked by you. This policy may be changed or updated from time to time.',
    ],
  },
  {
    heading: 'Advertising Partners Privacy Policies',
    paragraphs: [
      'You may consult this list to find the Privacy Policy for each of the advertising partners of SU.',
      "Third-party ad servers or ad networks use technologies like cookies, JavaScript, or Web Beacons used in their respective advertisements and links that appear on SU, which are sent directly to users' browsers. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on websites that you visit.",
      'Note that SU has no access to or control over these cookies that are used by third-party advertisers.',
    ],
  },
  {
    heading: 'Third-Party Privacy Policies',
    paragraphs: [
      "SU's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt out of certain options.",
      'You can choose to disable cookies through your individual browser options. To know more detailed information about cookie management with specific web browsers, it can be found on the browsers’ respective websites.',
      'SU does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately and we will do our best efforts to remove such information from our records promptly.',
    ],
  },
  {
    heading: 'Changes to This Privacy Policy',
    paragraphs: [
      'We may update our Privacy Policy from time to time. Thus, we advise you to review this page periodically for any changes. We will notify you of any changes by posting the new Privacy Policy on this page. These changes are effective immediately after they are posted on this page.',
    ],
  },
  {
    heading: 'Contact Us',
    paragraphs: [
      'If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us.',
    ],
  },
];

const TERMS_SECTIONS = [
  {
    paragraphs: [
      'At SU, accessible from https://su.edu.bd/, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information collected and recorded by SU and how we use it.',
      'If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.',
      'This Privacy Policy applies only to our online activities and is valid for visitors to our website with regards to the information that they shared and/or collect in SU. This policy is not applicable to any information collected offline or via channels other than this website.',
    ],
  },
  {
    heading: 'Consent',
    paragraphs: [
      'By using our website, you hereby consent to our Privacy Policy and agree to its terms.',
    ],
  },
  {
    heading: 'Information we collect',
    paragraphs: [
      'The personal information you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information. If you contact us directly, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide. When you register for an Account, we may ask for your contact information, including items such as name, company name, address, email address, and telephone number.',
    ],
  },
  {
    heading: 'How we use your information',
    paragraphs: [
      'We use the information we collect in various ways, including:',
      'Provide, operate, and maintain our website.',
      'Improve, personalize, and expand our website.',
      'Understand and analyze how you use our website.',
      'Develop new products, services, features, and functionality.',
      'Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes.',
      'Send you emails.',
      'Find and prevent fraud.',
    ],
  },
  {
    heading: 'Log Files',
    paragraphs: [
      "SU follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and are a part of hosting services’ analytics. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users’ movement on the website, and gathering demographic information.",
    ],
  },
];

async function seedLegalPagesContent() {
  await prisma.legalPagesContent.upsert({
    where: { id: 'singleton' },
    // Idempotent — see seedAdmissionNotice comment. Previously this
    // unconditionally reset privacySections/termsSections to these
    // hardcoded defaults on every db:seed run, wiping admin edits.
    update: {},
    create: {
      id: 'singleton',
      privacyHeroTitle:                'Privacy Policy',
      privacyHeroOverline:             'Legal',
      privacyHeroImageUrl:             '/assets/contact-hero.webp',
      privacyHeroImagePublicId:        null,
      privacyHeroImageVerticalPercent: 50,
      privacySections:                 PRIVACY_SECTIONS,
      termsHeroTitle:                  'Terms & Conditions',
      termsHeroOverline:               'Legal',
      termsHeroImageUrl:               '/assets/contact-hero.webp',
      termsHeroImagePublicId:          null,
      termsHeroImageVerticalPercent:   50,
      termsSections:                   TERMS_SECTIONS,
    },
  });
  console.log('✓ LegalPagesContent seeded (singleton)');
}

async function main() {
  console.log('Seeding database…\n');
  await seedDepartmentIdentity();
  await seedUniversityIdentity();
  await seedPrograms();
  await seedProgramCourseStructure();
  await seedResearchAreas();
  await seedFaculty();
  await bootstrapSuperAdmin();

  console.log('\nPhase 3 chrome structure…');
  await backfillDepartmentIdentityAlts();
  await backfillFeaturedResearchArea();
  await seedTopLinks();
  await seedQuickAccessItems();
  await seedMainNav();
  await seedFooterUsefulLinks();
  await seedFooterGetInTouchLinks();
  await seedFooterQuickLinks();
  await seedFooterLegalLinks();

  console.log('\nPhase 4 about pages…');
  await seedAboutOverview();
  await seedAboutMissionVision();
  await seedAboutMechaClub();

  console.log('\nPhase 5 lab systems…');
  await seedLabFacilityLanding();
  await seedLabs();
  await seedLaboratoryFacilityLanding();
  await seedLaboratoryLabs();

  console.log('\nPhase 6 content hubs…');
  await seedNews();
  await seedEvents();
  await seedNotices();
  await seedGalleryImages();

  console.log('\nPhase 7 student society + transport…');
  await seedAlumni();
  await seedClubs();
  await seedFaqs();
  await seedVisitors();
  await seedResearchPapers();
  await seedBusRoutes();
  await seedSyllabus();
  await seedTransportLanding();

  console.log('\nPhase 8a admission CMS part 1…');
  await seedAdmissionNotice();
  await seedProspectusEntries();

  console.log('\nPhase 8b admission CMS part 2…');
  await seedAdmissionRequirements();
  await seedProgramFeeStructures();

  console.log('\nPhase 8c admission CMS part 3…');
  await seedAdmissionTransferCredits();
  await seedWaiverScholarshipLanding();
  await seedWaiverCategories();
  await seedScholarships();

  console.log('\nPhase 10 contact page content…');
  await seedContactPageContent();
  await seedCampusLocations();

  console.log('\nPhase 12 journey CTA…');
  await seedJourneyCTAContent();

  console.log('\nPhase 17 legal pages…');
  await seedLegalPagesContent();

  console.log('\nDone.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
