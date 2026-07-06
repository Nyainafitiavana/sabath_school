import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Questions globales fixes
  const questions = [
    { code: 'asa_soa', libelle: 'Firy ny nanao asa soa', ordre: 1 },
    { code: 'conference_biblique', libelle: 'Firy ny nanao conférence ara-baiboly', ordre: 2 },
    { code: 'partage_fanapiana', libelle: 'Firy no nizara fanapiana', ordre: 3 },
    { code: 'visiteurs', libelle: 'Firy ny mpitsidika', ordre: 4 },
    { code: 'nouveaux_membres', libelle: 'Firy ny mpikambana vaovao', ordre: 5 },
  ];

  for (const q of questions) {
    await prisma.questionGlobale.upsert({
      where: { code: q.code },
      update: { libelle: q.libelle, ordre: q.ordre },
      create: q,
    });
  }

  // Utilisateur ADMIN par défaut
  const adminEmail = 'admin@sabath.local';
  const adminPassword = 'Admin1234!';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.utilisateur.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      nom: 'Admin',
      prenom: 'Système',
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log('\n========================================');
  console.log('  SEED TERMINÉ — Compte administrateur');
  console.log('========================================');
  console.log(`  Email    : ${adminEmail}`);
  console.log(`  Mot de passe : ${adminPassword}`);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
