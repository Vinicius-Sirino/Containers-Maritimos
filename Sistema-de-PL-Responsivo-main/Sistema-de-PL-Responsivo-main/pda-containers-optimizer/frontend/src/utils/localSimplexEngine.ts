import {
  OptimizationRequest,
  OptimizationResult,
  SimplexIterationDto,
  TableauStateDto,
  SpecialAnalysisDto,
  OptimizationStatus,
} from '../types/optimizer';

const EPSILON = 1e-7;

export function solveSimplexLocally(request: OptimizationRequest): OptimizationResult {
  const startTime = performance.now();
  const numVariables = request.variables.length;
  const numConstraints = request.constraints.length;
  const totalColumns = numVariables + numConstraints + 1;
  const totalRows = numConstraints + 1;

  const colHeaders: string[] = [
    ...request.variables.map((v) => v.code),
    ...request.constraints.map((c) => c.slackCode),
    'RHS',
  ];

  const matrix: number[][] = Array.from({ length: totalRows }, () =>
    new Array(totalColumns).fill(0)
  );
  const basicVars: string[] = ['Z'];

  // Linha 0: Z
  for (let j = 0; j < numVariables; j++) {
    matrix[0][j] = -request.variables[j].profitCoefficient;
  }
  matrix[0][totalColumns - 1] = 0;

  // Linhas 1..m
  for (let i = 0; i < numConstraints; i++) {
    const row = i + 1;
    basicVars[row] = request.constraints[i].slackCode;
    for (let j = 0; j < numVariables; j++) {
      matrix[row][j] = request.technologyMatrix[i][j];
    }
    for (let s = 0; s < numConstraints; s++) {
      matrix[row][numVariables + s] = i === s ? 1.0 : 0.0;
    }
    matrix[row][totalColumns - 1] = request.constraints[i].capacityRhs;
  }

  const iterations: SimplexIterationDto[] = [];
  let iterationCount = 0;
  let status: OptimizationStatus = 'Optimal';
  let statusMessage = 'Solução ótima encontrada com sucesso.';
  const specialAnalysis: SpecialAnalysisDto = {
    hasMultipleOptimalSolutions: false,
    alternateOptimaVariables: [],
    isUnbounded: false,
    isDegenerate: false,
    notes: '',
  };

  const maxIter = request.maxIterations || 100;

  while (iterationCount < maxIter) {
    // 1. Encontrar coluna entrante (Regra de Dantzig)
    let enteringCol = -1;
    let mostNegativeCost = -EPSILON;

    for (let j = 0; j < totalColumns - 1; j++) {
      if (matrix[0][j] < mostNegativeCost) {
        mostNegativeCost = matrix[0][j];
        enteringCol = j;
      }
    }

    if (enteringCol === -1) {
      // Ótimo alcançado
      iterations.push({
        iterationNumber: iterationCount,
        tableau: captureTableau(matrix, basicVars, colHeaders),
        hasPivot: false,
        pivotRowIndex: -1,
        pivotColumnIndex: -1,
        pivotValue: 0,
        enteringVariableName: '',
        leavingVariableName: '',
        minimumRatios: [],
        explanation: `Convergência alcançada na iteração ${iterationCount}. Todos os custos reduzidos na Linha Z são não-negativos (c_j >= 0). A solução atual é ótima.`,
      });
      break;
    }

    // 2. Teste da razão mínima
    let leavingRow = -1;
    let minRatio = Infinity;
    const minimumRatios: (number | null)[] = [];

    for (let i = 1; i < totalRows; i++) {
      const denom = matrix[i][enteringCol];
      const rhs = matrix[i][totalColumns - 1];

      if (denom > EPSILON) {
        const ratio = rhs / denom;
        minimumRatios.push(ratio);
        if (ratio < minRatio - EPSILON) {
          minRatio = ratio;
          leavingRow = i;
        }
      } else {
        minimumRatios.push(null);
      }
    }

    if (leavingRow === -1) {
      status = 'Unbounded';
      statusMessage = `Problema Ilimitado: Coluna '${colHeaders[enteringCol]}' não possui elementos restritivos estritamente positivos.`;
      specialAnalysis.isUnbounded = true;
      specialAnalysis.notes = statusMessage;
      iterations.push({
        iterationNumber: iterationCount,
        tableau: captureTableau(matrix, basicVars, colHeaders),
        hasPivot: false,
        pivotRowIndex: -1,
        pivotColumnIndex: enteringCol,
        pivotValue: 0,
        enteringVariableName: colHeaders[enteringCol],
        leavingVariableName: '',
        minimumRatios,
        explanation: statusMessage,
      });
      break;
    }

    const pivotVal = matrix[leavingRow][enteringCol];
    const enteringVar = colHeaders[enteringCol];
    const leavingVar = basicVars[leavingRow];

    if (Math.abs(matrix[leavingRow][totalColumns - 1]) < EPSILON) {
      specialAnalysis.isDegenerate = true;
    }

    iterations.push({
      iterationNumber: iterationCount,
      tableau: captureTableau(matrix, basicVars, colHeaders),
      hasPivot: true,
      pivotRowIndex: leavingRow,
      pivotColumnIndex: enteringCol,
      pivotValue: pivotVal,
      enteringVariableName: enteringVar,
      leavingVariableName: leavingVar,
      minimumRatios,
      explanation: `Iteração ${iterationCount}: Variável entrante '${enteringVar}' (custo reduzido: ${matrix[0][enteringCol].toFixed(
        2
      )}). Variável sainte '${leavingVar}' (razão mínima θ = ${minRatio.toFixed(
        3
      )}). Elemento Pivô = ${pivotVal.toFixed(3)} em [Linha ${leavingRow}, Coluna ${enteringVar}].`,
    });

    // 3. Pivoteamento de Gauss-Jordan
    for (let c = 0; c < totalColumns; c++) {
      matrix[leavingRow][c] /= pivotVal;
    }

    for (let r = 0; r < totalRows; r++) {
      if (r !== leavingRow) {
        const factor = matrix[r][enteringCol];
        if (Math.abs(factor) > EPSILON) {
          for (let c = 0; c < totalColumns; c++) {
            matrix[r][c] -= factor * matrix[leavingRow][c];
            if (Math.abs(matrix[r][c]) < EPSILON) {
              matrix[r][c] = 0;
            }
          }
        }
      }
    }

    basicVars[leavingRow] = enteringVar;
    iterationCount++;
  }

  // 4. Múltiplas soluções ótimas
  if (status === 'Optimal') {
    for (let j = 0; j < totalColumns - 1; j++) {
      const colName = colHeaders[j];
      const isBasic = basicVars.slice(1).includes(colName);
      if (!isBasic && Math.abs(matrix[0][j]) < EPSILON) {
        specialAnalysis.hasMultipleOptimalSolutions = true;
        specialAnalysis.alternateOptimaVariables.push(colName);
      }
    }
    if (specialAnalysis.hasMultipleOptimalSolutions) {
      status = 'MultipleOptimalSolutions';
      statusMessage = `Solução Ótima Múltipla detectada: [${specialAnalysis.alternateOptimaVariables.join(
        ', '
      )}] possuem custo reduzido zero.`;
      specialAnalysis.notes = statusMessage;
    }
  }

  const optimalProfit = Math.max(0, matrix[0][totalColumns - 1]);
  const solutionDict: Record<string, number> = {};
  colHeaders.slice(0, totalColumns - 1).forEach((col) => (solutionDict[col] = 0));
  for (let i = 1; i < totalRows; i++) {
    solutionDict[basicVars[i]] = matrix[i][totalColumns - 1];
  }

  const cargoAllocations = request.variables.map((v) => {
    const qty = solutionDict[v.code] || 0;
    return {
      code: v.code,
      name: v.name,
      optimalQuantity: Math.max(0, qty),
      unitProfit: v.profitCoefficient,
      totalProfitContribution: Math.round(qty * v.profitCoefficient * 100) / 100,
      unit: v.unit || 'unid',
    };
  });

  const resourceUtilizations = request.constraints.map((c) => {
    const slack = solutionDict[c.slackCode] || 0;
    const consumed = Math.max(0, c.capacityRhs - slack);
    const percentage = c.capacityRhs > 0 ? (consumed / c.capacityRhs) * 100 : 0;
    return {
      slackCode: c.slackCode,
      name: c.name,
      totalCapacity: c.capacityRhs,
      consumedAmount: Math.round(consumed * 100) / 100,
      slackRemaining: Math.round(slack * 100) / 100,
      utilizationPercentage: Math.round(percentage * 10) / 10,
      unit: c.unit,
      isBottleneck: slack < EPSILON,
    };
  });

  const endTime = performance.now();

  return {
    success: status === 'Optimal' || status === 'MultipleOptimalSolutions',
    status,
    statusMessage,
    optimalProfit: Math.round(optimalProfit * 100) / 100,
    cargoAllocations,
    resourceUtilizations,
    specialAnalysis,
    iterations,
    totalIterations: iterations.length,
    executionTimeMs: endTime - startTime,
  };
}

function captureTableau(matrix: number[][], basicVars: string[], colHeaders: string[]): TableauStateDto {
  return {
    columnHeaders: [...colHeaders],
    basicVariableNames: [...basicVars],
    matrix: matrix.map((row) => row.map((v) => Math.round(v * 1000) / 1000)),
  };
}

