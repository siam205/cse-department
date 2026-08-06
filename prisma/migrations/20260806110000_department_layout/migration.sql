-- CreateTable
CREATE TABLE "department_layout" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT NOT NULL,
    "coverPublicId" TEXT,
    "pdfUrl" TEXT,
    "pdfPublicId" TEXT,
    "pdfFileName" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_layout_pkey" PRIMARY KEY ("id")
);
