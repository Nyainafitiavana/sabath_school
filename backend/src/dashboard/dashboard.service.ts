import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Sabbat } from '@prisma/client';

const TRIMESTRE_MOIS: Record<number, number[]> = {
  1: [1, 2, 3],
  2: [4, 5, 6],
  3: [7, 8, 9],
  4: [10, 11, 12],
};

const MOIS_LABELS = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const SABBAT_LABELS: Record<string, string> = {
  SABBAT_1: 'Sabbat 1', SABBAT_2: 'Sabbat 2', SABBAT_3: 'Sabbat 3',
  SABBAT_4: 'Sabbat 4', SABBAT_5: 'Sabbat 5',
};

interface FilterOpts {
  annee?: number;
  trimestre?: number;
  mois?: number;
  sabbat?: Sabbat;
  classeId?: string;
  userRole?: Role;
  userClasseId?: string | null;
}

function buildAppelWhere(opts: FilterOpts): any {
  const w: any = { statut: 'FAIT' };
  if (opts.trimestre) w.trimestre = opts.trimestre;
  if (opts.mois)      w.mois      = opts.mois;
  if (opts.sabbat)    w.sabbat    = opts.sabbat;
  if (opts.annee)     w.classe    = { registre: { annee: opts.annee } };

  if (opts.userRole === Role.RESPONSABLE && opts.userClasseId) {
    w.classeId = opts.userClasseId;
  } else if (opts.classeId) {
    w.classeId = opts.classeId;
  }
  return w;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(opts: FilterOpts) {
    const appelWhere = buildAppelWhere(opts);

    // Build classe scope
    const classeWhere: any = {};
    if (opts.userRole === Role.RESPONSABLE && opts.userClasseId) {
      classeWhere.id = opts.userClasseId;
    } else if (opts.classeId) {
      classeWhere.id = opts.classeId;
    }
    if (opts.annee) classeWhere.registre = { annee: opts.annee };

    const classes = await this.prisma.classe.findMany({
      where: classeWhere,
      select: { id: true, nom: true },
    });

    const statsParClasseRaw = await Promise.all(
      classes.map(async (classe) => {
        const appels = await this.prisma.appel.findMany({
          where: { ...appelWhere, classeId: classe.id },
          select: { id: true },
        });

        // Skip classes that have no appels for the active filters
        if (appels.length === 0) return null;

        const appelsIds = appels.map((a) => a.id);

        const totalMembres = await this.prisma.utilisateur.count({
          where: { classeId: classe.id, role: { in: [Role.RESPONSABLE, Role.MEMBRE] } },
        });

        const presencesStats = await this.prisma.presence.aggregate({
          where: {
            appelId: { in: appelsIds },
            present: true,
            frequenceApprentissage: { not: null },
          },
          _avg: { frequenceApprentissage: true },
          _count: true,
        });

        const tauxApprentissage = presencesStats._avg.frequenceApprentissage
          ? (presencesStats._avg.frequenceApprentissage / 7) * 100
          : 0;

        const [nbPresents, nbAbsents, nbSept7] = await Promise.all([
          this.prisma.presence.count({ where: { appelId: { in: appelsIds }, present: true } }),
          this.prisma.presence.count({ where: { appelId: { in: appelsIds }, present: false } }),
          this.prisma.presence.count({ where: { appelId: { in: appelsIds }, present: true, frequenceApprentissage: 7 } }),
        ]);

        const totalPresences = nbPresents + nbAbsents;
        const tauxPresence = totalPresences > 0 ? Math.round((nbPresents / totalPresences) * 1000) / 10 : 0;
        const tauxAbsence  = totalPresences > 0 ? Math.round((nbAbsents  / totalPresences) * 1000) / 10 : 0;

        return {
          classeId: classe.id,
          classeNom: classe.nom,
          totalMembres,
          nbSept7,
          nbPresents,
          nbAbsents,
          tauxPresence,
          tauxAbsence,
          tauxApprentissage: Math.round(tauxApprentissage * 10) / 10,
          nombrePresencesAnalysees: presencesStats._count,
        };
      }),
    );

    const statsParClasse = statsParClasseRaw.filter(Boolean) as NonNullable<(typeof statsParClasseRaw)[0]>[];

    const top5 = [...statsParClasse]
      .sort((a, b) => b.tauxApprentissage - a.tauxApprentissage)
      .slice(0, 5);

    const appelsIds = (
      await this.prisma.appel.findMany({ where: appelWhere, select: { id: true } })
    ).map((a) => a.id);

    const questions = await this.prisma.questionGlobale.findMany({ orderBy: { ordre: 'asc' } });
    const totauxQuestions = await Promise.all(
      questions.map(async (q) => {
        const sum = await this.prisma.reponseQuestionGlobale.aggregate({
          where: { appelId: { in: appelsIds }, questionId: q.id },
          _sum: { valeur: true },
        });
        return { questionId: q.id, code: q.code, libelle: q.libelle, total: sum._sum.valeur ?? 0 };
      }),
    );

    return { statsParClasse, top5, totauxQuestions };
  }

  /**
   * Time-series for the area chart.
   *
   * - mois selected  → sabbat breakdown for that month (only sabbats with appels)
   * - mois not set   → monthly breakdown (only months with appels)
   *   - trimestre set → restrict to trimestre's 3 months
   *   - trimestre not set → all 12 months
   *
   * sabbat filter applies to monthly views; ignored for sabbat axis when drilling a month.
   */
  async getSerie(opts: FilterOpts): Promise<{ label: string; taux: number; nbSept7: number }[]> {
    const computeStats = async (extraWhere: any): Promise<{ taux: number; nbSept7: number }> => {
      const baseWhere = buildAppelWhere(opts);
      const appels = await this.prisma.appel.findMany({
        where: { ...baseWhere, ...extraWhere },
        select: { id: true },
      });
      if (!appels.length) return { taux: 0, nbSept7: 0 };
      const ids = appels.map((a) => a.id);
      const [stats, nbSept7] = await Promise.all([
        this.prisma.presence.aggregate({
          where: { appelId: { in: ids }, present: true, frequenceApprentissage: { not: null } },
          _avg: { frequenceApprentissage: true },
        }),
        this.prisma.presence.count({
          where: { appelId: { in: ids }, present: true, frequenceApprentissage: 7 },
        }),
      ]);
      const taux = stats._avg.frequenceApprentissage
        ? Math.round((stats._avg.frequenceApprentissage / 7) * 100 * 10) / 10
        : 0;
      return { taux, nbSept7 };
    };

    if (opts.mois) {
      const baseForAxis = buildAppelWhere({ ...opts, sabbat: undefined });
      const allSabbats = ['SABBAT_1', 'SABBAT_2', 'SABBAT_3', 'SABBAT_4', 'SABBAT_5'] as Sabbat[];
      const results = await Promise.all(
        allSabbats.map(async (s) => {
          const count = await this.prisma.appel.count({
            where: { ...baseForAxis, mois: opts.mois, sabbat: s },
          });
          if (count === 0) return null;
          const { taux, nbSept7 } = await computeStats({ mois: opts.mois, sabbat: s });
          return { label: SABBAT_LABELS[s], taux, nbSept7 };
        }),
      );
      return results.filter(Boolean) as { label: string; taux: number; nbSept7: number }[];
    }

    const moisList = opts.trimestre
      ? (TRIMESTRE_MOIS[opts.trimestre] ?? [])
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    return Promise.all(
      moisList.map(async (m) => {
        const { taux, nbSept7 } = await computeStats({ mois: m });
        return { label: MOIS_LABELS[m], taux, nbSept7 };
      }),
    );
  }
}
