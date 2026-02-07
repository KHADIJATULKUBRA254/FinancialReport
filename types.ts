
export interface FinancialMetric {
  label: string;
  current_year: number;
  previous_year: number;
  unit: string;
}

export interface FinancialData {
  is_financial_statement: boolean;
  company_name: string;
  reporting_year: string;
  currency: string;
  metrics: FinancialMetric[];
  investor_summary: string;
  investment_recommendation: 'BUY' | 'HOLD' | 'SELL';
  fair_value_assessment: string;
  invest_conclusion: string; // Explicit "Should you invest or not" wording
}

export interface LoadingState {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
}
