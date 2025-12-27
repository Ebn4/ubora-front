import { Evaluator } from "./evaluator.model";

export interface PeriodState {
  evaluators: Evaluator[];
  isDispatched: boolean;
  hasEvaluators: boolean;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}


export interface PeriodStateResponse {
  success: boolean;
  data: PeriodState;
}
