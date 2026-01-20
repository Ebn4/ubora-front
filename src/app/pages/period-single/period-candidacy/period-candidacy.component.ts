import {
  Component,
  inject,
  Input,
  OnChanges, signal,
  SimpleChanges,
} from '@angular/core';
import {Period} from '../../../models/period';
import {Subscription} from 'rxjs';
import {ListeningChangeService} from '../../../services/listening-change.service';
import {FormsModule} from '@angular/forms';
import {NgFor} from '@angular/common';
import {Candidacy} from '../../../models/candidacy';
import {CandidacyService} from '../../../services/candidacy.service';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {BaseListWidget} from '../../../widgets/base-list-widget';
import {PreselectionService} from '../../../services/preselection.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {PeriodService} from '../../../services/period.service';
import {PeriodStatus} from '../../../enum/period-status.enum';
import * as XLSX from 'xlsx';
import saveAs from 'file-saver';


@Component({
  selector: 'app-period-candidacy',
  imports: [FormsModule, NgFor, RouterLink],
  templateUrl: './period-candidacy.component.html',
  standalone: true
})
export class PeriodCandidacyComponent
  extends BaseListWidget
  implements OnChanges {

  private subscription!: Subscription;
  candidacies: Candidacy[] = [];
  @Input() period?: Period;
  ville: string = '';
  institute_count: number = 0
  candidacy_count: number = 0
  city_count: number = 0
  preselection_count: number = 0
  selection_count: number = 0

  readonly snackbar = inject(MatSnackBar)
  route: ActivatedRoute = inject(ActivatedRoute);
  candidacyService: CandidacyService = inject(CandidacyService);

  constructor(private modalService: ListeningChangeService) {
    super();
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

  ngOnInit(): void {
    this.loadData();
    this.subscription = this.modalService.modalClosed$.subscribe((modalClosed) => {
      if (modalClosed) {
        this.loadData();
        this.modalService.resetNotification();
      }
    });
  }

   exportToExcel() {
        if (!this.period?.id) return;
  
        this.candidacyService.getCandidacies(1,'','',this.period?.id, 'all')
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
              XLSX.utils.book_append_sheet(workbook, worksheet, "Eligible");
              const excelBuffer = XLSX.write(workbook, {
                bookType: 'xlsx',
                type: 'array'
              });
              const fileName = `candidats_eligible_periode_${this.period?.year}.xlsx`;
              saveAs(new Blob([excelBuffer]), fileName);
            },
            error: (err) => {
              console.error(err);
              this.snackbar.open("Erreur lors de l'exportation", "Fermer", {
                duration: 3000
              });
            }
          });
  }

  override loadData() {
    this.candidacyService
      .getCandidacies(
        this.currentPage,
        this.search,
        this.ville,
        this.period?.id,
        this.per_page
      )
      .subscribe({
        next: (response) => {
          this.candidacies = response.data;
          this.currentPage = response.meta.current_page;
          this.lastPage = response.meta.last_page;

          if (this.candidacies.length > 0) {
            this.institute_count = this.candidacies[0].institute_count;
            this.candidacy_count = this.candidacies[0].candidacy_count;
            this.city_count = this.candidacies[0].city_count;
            this.preselection_count = this.candidacies[0].preselection_count;
            this.selection_count = this.candidacies[0].selection_count;
          } else {
            this.institute_count = 0;
            this.candidacy_count = 0;
            this.city_count = 0;
            this.preselection_count = 0
            this.selection_count = 0
          }
        },
        error: (error) => {
          console.error('Error loading candidacies:', error);
        }
      });
  }

}
