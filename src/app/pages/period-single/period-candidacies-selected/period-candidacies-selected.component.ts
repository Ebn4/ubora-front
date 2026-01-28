import { Component, inject, Input, signal, SimpleChanges } from '@angular/core';
import { BaseListWidget } from '../../../widgets/base-list-widget';
import { Candidacy } from '../../../models/candidacy';
import { Period } from '../../../models/period';
import { CandidacyService } from '../../../services/candidacy.service';
import { NgForOf, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { PeriodStatus } from '../../../enum/period-status.enum';
import { PdfService } from '../../../services/pdf.service';
import { CriteriaService } from '../../../services/criteria.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PeriodService } from '../../../services/period.service';

@Component({
  selector: 'app-period-candidacies-selected',
  imports: [
    NgForOf,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    NgIf
  ],
  templateUrl: './period-candidacies-selected.component.html',
  styles: ``
})
export class PeriodCandidaciesSelectedComponent extends BaseListWidget {

  @Input() period?: Period;
  candidacies = signal<Candidacy[]>([])
  isLoading = signal(false)
  PeriodStatus = PeriodStatus;

  candidacyService: CandidacyService = inject(CandidacyService);
  snackbar = inject(MatSnackBar)
  private pdfService = inject(PdfService);
  private criteriaService = inject(CriteriaService);
  private periodService = inject(PeriodService);

  isGeneratingAllPdfs = signal(false);
  generatingCandidates = signal<Set<number>>(new Set());
  maxScore = signal<number>(20);
  isLoadingMaxScore = signal(false);

  ngOnInit() {
    this.loadData()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['period']) {
      const current = changes['period'].currentValue;
      this.period = current;
      if (current) {
        this.loadData();
        this.loadMaxScore();
      }
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.lastPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  isGeneratingPdfForCandidate(candidateId: number): boolean {
    return this.generatingCandidates().has(candidateId);
  }

  // Méthode pour générer le PDF d'un candidat
  async generateCandidatePdf(candidate: Candidacy) {
    if (!this.period?.id || !candidate?.id || this.isGeneratingPdfForCandidate(candidate.id)) {
      return;
    }

    // Ajouter à la liste des générations en cours
    const currentSet = new Set(this.generatingCandidates());
    currentSet.add(candidate.id);
    this.generatingCandidates.set(currentSet);

    try {
      // Récupérer les données d'évaluation depuis l'API
      const evaluationData = await this.candidacyService.getCandidateEvaluationResultsByPeriod(
        candidate.id,
        this.period.id
      ).toPromise();

      if (!evaluationData || !evaluationData.data) {
        throw new Error('Impossible de récupérer les données d\'évaluation');
      }

      const data = evaluationData.data;

      // Formater les données pour le service PDF
      const candidateData = {
        id: candidate.id,
        etn_nom: candidate.etn_nom || '',
        etn_postnom: candidate.etn_postnom || '',
        etn_prenom: candidate.etn_prenom || '',
        sexe: candidate.sexe || '',
        ville: candidate.ville || '',
        universite_institut_sup: candidate.universite_institut_sup || '',
        selectionMean: data.mean_score || 0,
        etn_email: candidate.etn_email || '',
        nationalite: candidate.nationalite || '',
        faculte: candidate.faculte || '',
        telephone: candidate.telephone || '',
        promotion_academique: candidate.promotion_academique || '',
        observation : candidate.observation || ''
      };

      // Formater les critères et résultats
      const criteriaList = data.evaluation_results.map((item: any) => ({
        id: item.criteria_id,
        name: item.criteria_name,
        description: item.criteria_description,
        ponderation: item.ponderation
      }));

      const evaluationResults = data.evaluation_results.map((item: any) => ({
        criteriaId: item.criteria_id,
        result: item.result,
        percentage: item.percentage,
        evaluatorName: item.evaluator_name,
        comment: item.comment,
        evaluatedAt: item.evaluated_at,
        isEvaluated: item.is_evaluated
      }));

      // Générer le PDF
      await this.pdfService.generateEvaluationReport(
        candidateData,
        criteriaList,
        evaluationResults
      );

      this.snackbar.open(`PDF généré pour ${candidate.etn_nom} ${candidate.etn_postnom}`, 'Fermer', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });

    } catch (error: any) {
      console.error('Erreur génération PDF:', error);

      let errorMessage = 'Erreur lors de la génération du PDF';
      if (error?.message?.includes('generateEvaluationReport')) {
        errorMessage = 'Le service PDF n\'est pas disponible';
      }

      this.snackbar.open(`Erreur pour ${candidate.etn_nom}: ${errorMessage}`, 'Fermer', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      // Retirer de la liste des générations en cours
      const currentSet = new Set(this.generatingCandidates());
      currentSet.delete(candidate.id);
      this.generatingCandidates.set(currentSet);
    }
  }

  // Méthode pour générer tous les PDF
  async generateAllPdfs() {
    const candidates = this.candidacies();
    if (!this.period?.id || this.isGeneratingAllPdfs() || candidates.length === 0) {
      return;
    }

    this.isGeneratingAllPdfs.set(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Générer les PDF un par un
      for (const candidate of candidates) {
        try {
          if (!candidate?.id) continue;

          await this.generateCandidatePdf(candidate);
          successCount++;

          // Petite pause pour éviter de surcharger le navigateur
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.error(`Erreur pour ${candidate.etn_nom}:`, error);
          errorCount++;
        }
      }

      // Afficher le résultat
      let message = '';
      if (successCount === candidates.length) {
        message = 'Tous les PDF ont été générés avec succès';
      } else if (successCount > 0) {
        message = `${successCount} PDF générés, ${errorCount} échecs`;
      } else {
        message = 'Aucun PDF n\'a pu être généré';
      }

      this.snackbar.open(message, 'Fermer', {
        duration: 5000,
        panelClass: successCount > 0 ? ['success-snackbar'] : ['error-snackbar']
      });

    } catch (error) {
      console.error('Erreur lors de la génération de tous les PDF:', error);
      this.snackbar.open('Erreur lors de la génération des PDF', 'Fermer', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isGeneratingAllPdfs.set(false);
    }
  }

  // Méthode pour l'évaluation rapide
  quickEvaluate(candidate: Candidacy) {
    // Implémentez votre logique d'évaluation rapide ici
    console.log('Évaluation rapide pour:', candidate);
  }

  exportToExcel() {
      if (!this.period?.id) return;

      this.candidacyService.getSelectionCandidates(this.period.id,1, '', 'all')
        .subscribe({
          next: (response) => {
            const data = response.data.map((c: any) => ({
              Nom: c.etn_nom,
              Postnom: c.etn_postnom,
              Prenom: c.etn_prenom,
              Sexe: c.sexe,
              Email: c.etn_email,
              Adresse: c.adresse,
              Ville: c.ville,
              Province: c.province,
              Nationalité: c.nationalite,
              Université: c.universite_institut_sup,
              Faculte: c.faculte,
              Adresse_universite: c.adresse_universite,
              Telephone: c.telephone,
              Degre_parente_agent_orange: c.degre_parente_agent_orange,
              Institution_scolaire: c.institution_scolaire,
              Montant_frais: c.montant_frais,
              Attestation_de_reussite_derniere_annee: c.attestation_de_reussite_derniere_annee,
              Autres_diplomes_et_attestations: c.autres_diplomes_atttestation,
              Releve_de_note_derniere_annee: c.releve_note_derniere_annee,
              Annee_diplome_d_etat: c.annee_diplome_detat,
              Lettre_de_motivation: c.lettre_motivation,
              Diplome_d_etat: c.diplome_detat,
              Pourcentage_obtenu: c.pourcentage_obtenu,
              Annee_d_obtention_diplome_d_etat: c.annee_diplome_detat,
              CV: c.cv,
              Autres_attestations: c.autres_diplomes_atttestation,
              Periode: this.period?.year,
              Moyenne_selection: c.selectionMean || 0
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Sélectionnés");
            const excelBuffer = XLSX.write(workbook, {
              bookType: 'xlsx',
              type: 'array'
            });
            const fileName = `candidats_selectionnes_periode_${this.period?.year}.xlsx`;
            saveAs(new Blob([excelBuffer]), fileName);
          },
          error: (err) => {
            console.error(err);
            this.snackbar.open("Erreur lors de l'exportation", "Fermer", {
              duration: 3000
            });
            this.isLoading.set(false);
          }
        });
  }

  loadMaxScore() {
    if (!this.period?.id) {
      this.maxScore.set(20);
      return;
    }

    this.periodService.getSelectionCriteriaMaxScore(this.period.id)
      .subscribe({
        next: (maxScoreValue: number) => {
          this.maxScore.set(maxScoreValue);
        },
        error: (error) => {
          console.error('Erreur lors du chargement du score max:', error);
          this.snackbar.open('Erreur chargement configuration scores', 'Fermer', { duration: 3000 });
          this.maxScore.set(100); // Valeur par défaut
        }
      });
  }

  override loadData() {
    this.isLoading.set(true)
    this.candidacyService
      .getSelectionCandidates(
        this.period?.id ?? 0,
        this.currentPage,
        this.search,
        this.per_page
      )
      .subscribe({
        next: (response) => {
          this.candidacies.set(response.data);
          this.currentPage = response.meta.current_page;
          this.lastPage = response.meta.last_page;
          this.isLoading.set(false)
        },
        error: (error) => {
          console.error('Error loading candidacies:', error);
          this.snackbar.open('Erreur lors de la recuperation des candidats', 'Actualiser', {
            duration: 3000,
          })
          this.isLoading.set(false)
        }
      });
  }
}
