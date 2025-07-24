export interface CriteriaPeriod {
  id: number;
  name: string;
  description: string;
  status: string;
  type?: string | null;
  ponderation?: string | null;
  period_criteria_id: number;
  valeur: number | null;
  isChecked: boolean;
}
