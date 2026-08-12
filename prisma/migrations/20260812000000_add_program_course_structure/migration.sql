-- CreateTable
CREATE TABLE "program_course_structure" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "careerProspectsHeading" TEXT NOT NULL DEFAULT 'Career Prospects',
    "careerProspectsBody" TEXT NOT NULL,
    "sessionalBadgeIconName" TEXT NOT NULL DEFAULT 'FlaskConical',
    "semesters" JSONB NOT NULL,
    "pdfUrl" TEXT,
    "pdfPublicId" TEXT,
    "pdfFileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_course_structure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "program_course_structure_programId_key" ON "program_course_structure"("programId");

-- AddForeignKey
ALTER TABLE "program_course_structure" ADD CONSTRAINT "program_course_structure_programId_fkey" FOREIGN KEY ("programId") REFERENCES "program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
