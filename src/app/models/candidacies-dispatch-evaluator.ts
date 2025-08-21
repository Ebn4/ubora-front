export interface CandidaciesDispatchEvaluator {
  id: number;
  post_work_id: string;
  form_id: string;
  form_submited_at: string;
  etn_nom: string;
  etn_email: string;
  etn_prenom: string;
  etn_postnom: string;
  etn_naissance: string | null;
  ville: string;
  telephone: string;
  adresse: string;
  province: string;
  nationalite: string;
  cv: string;
  releve_note_derniere_annee: string;
  en_soumettant: string;
  section_option: string;
  j_atteste: string;
  degre_parente_agent_orange: string;
  annee_diplome_detat: string;
  diplome_detat: string;
  autres_diplomes_atttestation: string;
  universite_institut_sup: string;
  pourcentage_obtenu: string;
  lettre_motivation: string;
  adresse_universite: string;
  parente_agent_orange: string;
  institution_scolaire: string;
  montant_frais: string;
  sexe: string;
  attestation_de_reussite_derniere_annee: string;
  user_last_login: string;
  faculte: string;
  evaluateur1: number | null;
  evaluateur2: number | null;
  evaluateur3: number | null;
  somme_notes: number | null;
  created_at: string;
  updated_at: string;
  period_id: number;
  candidaciesPreselection: number
  statusCandidacy: boolean
  totalCandidats: number;
  periodStatus: string;
  dispatch: [
    {
      id: number,
      user_id: number,
      type: string,
      created_at: string,
      updated_at: string,
      period_id: 4,
      pivot: {
        candidacy_id: number,
        evaluator_id: number,
        id: number
      }
    },
  ]
}
