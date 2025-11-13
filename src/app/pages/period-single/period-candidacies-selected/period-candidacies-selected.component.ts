import {Component, inject, Input, signal, SimpleChanges} from '@angular/core';
import {BaseListWidget} from '../../../widgets/base-list-widget';
import {Candidacy} from '../../../models/candidacy';
import {Period} from '../../../models/period';
import {CandidacyService} from '../../../services/candidacy.service';
import {NgForOf, NgIf} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { PeriodStatus } from '../../../enum/period-status.enum';

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

  ngOnInit() {
    this.loadData()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['period']) {
      const current = changes['period'].currentValue;
      this.period = current;
      if (current) {
        this.loadData();
      }
    }
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
              Periode: this.period?.year
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
