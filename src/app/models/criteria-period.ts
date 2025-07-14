export interface CriteriaPeriod {
  id: number;
  name: string;
  description: string;
  status: string;
  type?: string | null;
  ponderation?: string | null;
  period_criteria_id: number;
  isChecked: boolean;
}
