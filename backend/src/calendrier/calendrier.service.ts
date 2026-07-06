import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class CalendrierService {
  /**
   * Retourne la liste des samedis (sabbats) d'un mois donné.
   * mois : 1-12
   */
  getSabbatsDuMois(annee: number, mois: number): { sabbat: string; date: string }[] {
    if (mois < 1 || mois > 12) throw new BadRequestException('Mois invalide (1-12).');
    if (annee < 2000 || annee > 2100) throw new BadRequestException('Année invalide.');

    const samedis: Date[] = [];
    // Premier jour du mois
    const date = new Date(annee, mois - 1, 1);

    // Avancer jusqu'au premier samedi (jour 6)
    while (date.getDay() !== 6) {
      date.setDate(date.getDate() + 1);
    }

    // Collecter tous les samedis du mois
    while (date.getMonth() === mois - 1) {
      samedis.push(new Date(date));
      date.setDate(date.getDate() + 7);
    }

    const labels = ['SABBAT_1', 'SABBAT_2', 'SABBAT_3', 'SABBAT_4', 'SABBAT_5'];
    return samedis.map((d, i) => ({
      sabbat: labels[i],
      // toISOString() shifts to UTC and can return the previous day in UTC+ timezones
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    }));
  }
}
