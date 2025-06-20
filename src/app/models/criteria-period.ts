export interface CriteriaPeriod {
  id: number;
  name: string;
  description: string;
  status: string;
  type?: string | null;
  ponderation?: string | null;
  isChecked?: boolean;
}
