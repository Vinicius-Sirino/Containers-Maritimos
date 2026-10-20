export type OptimizationStatus = 
  | 'Optimal'
  | 'Unbounded'
  | 'MultipleOptimalSolutions'
  | 'Infeasible'
  | 'MaxIterationsExceeded';

export interface CargoVariableInput {
  code: string;
  name: string;
  profitCoefficient: number;
  unit?: string;
}

export interface ConstraintInput {
  slackCode: string;
  name: string;
  capacityRhs: number;
  unit: string;
}

export interface OptimizationRequest {
  scenarioName: string;
  variables: CargoVariableInput[];
  constraints: ConstraintInput[];
  technologyMatrix: number[][];
  maxIterations?: number;
}

export interface TableauStateDto {
  columnHeaders: string[];
  basicVariableNames: string[];
  matrix: number[][];
}

export interface SimplexIterationDto {
  iterationNumber: number;
  tableau: TableauStateDto;
  hasPivot: boolean;
  pivotRowIndex: number;
  pivotColumnIndex: number;
  pivotValue: number;
  enteringVariableName: string;
  leavingVariableName: string;
  minimumRatios: (number | null)[];
  explanation: string;
}

export interface CargoAllocationItem {
  code: string;
  name: string;
  optimalQuantity: number;
  unitProfit: number;
  totalProfitContribution: number;
  unit: string;
}

export interface ResourceUtilizationItem {
  slackCode: string;
  name: string;
  totalCapacity: number;
  consumedAmount: number;
  slackRemaining: number;
  utilizationPercentage: number;
  unit: string;
  isBottleneck: boolean;
}

export interface SpecialAnalysisDto {
  hasMultipleOptimalSolutions: boolean;
  alternateOptimaVariables: string[];
  isUnbounded: boolean;
  isDegenerate: boolean;
  notes: string;
}

export interface OptimizationResult {
  success: boolean;
  status: OptimizationStatus;
  statusMessage: string;
  optimalProfit: number;
  cargoAllocations: CargoAllocationItem[];
  resourceUtilizations: ResourceUtilizationItem[];
  specialAnalysis: SpecialAnalysisDto;
  iterations: SimplexIterationDto[];
  totalIterations: number;
  executionTimeMs: number;
}

