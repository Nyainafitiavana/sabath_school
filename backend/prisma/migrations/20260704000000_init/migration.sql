-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'RESPONSABLE', 'MEMBRE');

-- CreateEnum
CREATE TYPE "Sabbat" AS ENUM ('SABBAT_1', 'SABBAT_2', 'SABBAT_3', 'SABBAT_4', 'SABBAT_5');

-- CreateEnum
CREATE TYPE "StatutAppel" AS ENUM ('NON_FAIT', 'FAIT');

-- CreateTable
CREATE TABLE "Registre" (
    "id" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classe" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "registreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Classe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "contact" TEXT,
    "role" "Role" NOT NULL,
    "classeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appel" (
    "id" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "trimestre" INTEGER NOT NULL,
    "mois" INTEGER NOT NULL,
    "sabbat" "Sabbat" NOT NULL,
    "dateReelle" TIMESTAMP(3),
    "statut" "StatutAppel" NOT NULL DEFAULT 'NON_FAIT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presence" (
    "id" TEXT NOT NULL,
    "appelId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT false,
    "frequenceApprentissage" INTEGER,

    CONSTRAINT "Presence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionGlobale" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuestionGlobale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReponseQuestionGlobale" (
    "id" TEXT NOT NULL,
    "appelId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "valeur" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReponseQuestionGlobale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Registre_annee_key" ON "Registre"("annee");

-- CreateIndex
CREATE UNIQUE INDEX "Classe_nom_registreId_key" ON "Classe"("nom", "registreId");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Appel_classeId_trimestre_mois_sabbat_key" ON "Appel"("classeId", "trimestre", "mois", "sabbat");

-- CreateIndex
CREATE UNIQUE INDEX "Presence_appelId_utilisateurId_key" ON "Presence"("appelId", "utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionGlobale_code_key" ON "QuestionGlobale"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ReponseQuestionGlobale_appelId_questionId_key" ON "ReponseQuestionGlobale"("appelId", "questionId");

-- AddForeignKey
ALTER TABLE "Classe" ADD CONSTRAINT "Classe_registreId_fkey" FOREIGN KEY ("registreId") REFERENCES "Registre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Utilisateur" ADD CONSTRAINT "Utilisateur_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appel" ADD CONSTRAINT "Appel_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_appelId_fkey" FOREIGN KEY ("appelId") REFERENCES "Appel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReponseQuestionGlobale" ADD CONSTRAINT "ReponseQuestionGlobale_appelId_fkey" FOREIGN KEY ("appelId") REFERENCES "Appel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReponseQuestionGlobale" ADD CONSTRAINT "ReponseQuestionGlobale_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuestionGlobale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
