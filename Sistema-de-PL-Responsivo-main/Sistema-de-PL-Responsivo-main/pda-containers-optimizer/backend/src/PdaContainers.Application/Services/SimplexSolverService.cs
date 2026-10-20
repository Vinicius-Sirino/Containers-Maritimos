using System.Diagnostics;
using PdaContainers.Application.DTOs;
using PdaContainers.Application.Interfaces;
using PdaContainers.Domain.Enums;

namespace PdaContainers.Application.Services;

/// <summary>
/// Motor de Otimização Linear: Implementação do Algoritmo Simplex Tabular de 1 Fase
/// Desenvolvido do zero para resolução de problemas de alocação de cargas e estivagem logística.
/// </summary>
public class SimplexSolverService : ISimplexSolverService
{
    private const double Epsilon = 1e-7;

    public OptimizationResult Solve(OptimizationRequest request)
    {
        var stopwatch = Stopwatch.StartNew();
        ValidateRequest(request);

        int numVariables = request.Variables.Count;     // n variáveis de decisão (X1..Xn)
        int numConstraints = request.Constraints.Count; // m restrições operacionais (R1..Rm)
        int totalColumns = numVariables + numConstraints + 1; // [X1..Xn | S1..Sm | RHS]
        int totalRows = numConstraints + 1; // [Linha 0: Função Z | Linhas 1..m: Restrições]

        // 1. Definição dos cabeçalhos das colunas
        var colHeaders = new List<string>();
        for (int j = 0; j < numVariables; j++)
            colHeaders.Add(request.Variables[j].Code);
        for (int i = 0; i < numConstraints; i++)
            colHeaders.Add(request.Constraints[i].SlackCode);
        colHeaders.Add("RHS");

        // 2. Construção da Matriz Inicial do Tableau
        // Linha 0: Z - c1*X1 - c2*X2 ... = 0 (coeficientes negativos dos lucros)
        // Linhas 1..m: matriz tecnológica A com identidade I para as folgas e vetor b no RHS
        double[,] matrix = new double[totalRows, totalColumns];
        var basicVars = new string[totalRows];
        basicVars[0] = "Z";

        // Preenche Linha 0 (Função Objetivo)
        for (int j = 0; j < numVariables; j++)
        {
            matrix[0, j] = -request.Variables[j].ProfitCoefficient;
        }
        for (int i = 0; i < numConstraints; i++)
        {
            matrix[0, numVariables + i] = 0.0;
        }
        matrix[0, totalColumns - 1] = 0.0; // Lucro inicial Z = 0

        // Preenche Linhas de Restrição (1..m)
        for (int i = 0; i < numConstraints; i++)
        {
            int row = i + 1;
            basicVars[row] = request.Constraints[i].SlackCode; // Base inicial constituída pelas folgas

            // Coeficientes das variáveis de decisão (Consumos de recursos)
            for (int j = 0; j < numVariables; j++)
            {
                matrix[row, j] = request.TechnologyMatrix[i][j];
            }

            // Variável de folga Si (Matriz Identidade)
            for (int s = 0; s < numConstraints; s++)
            {
                matrix[row, numVariables + s] = (i == s) ? 1.0 : 0.0;
            }

            // Lado direito (Capacidade física do contentor)
            matrix[row, totalColumns - 1] = request.Constraints[i].CapacityRhs;
        }

        var iterations = new List<SimplexIterationDto>();
        int iterationCount = 0;
        OptimizationStatus status = OptimizationStatus.Optimal;
        string statusMessage = "Solução ótima encontrada com sucesso.";
        var specialAnalysis = new SpecialAnalysisDto();

        // 3. Ciclo Principal do Algoritmo Simplex Tabular
        while (iterationCount < request.MaxIterations)
        {
            // PASSO A: Critério de Otimalidade e Determinação da Coluna Entrante (Regra de Dantzig)
            // Procura o coeficiente mais negativo na linha da função objetivo (Linha 0).
            int enteringCol = -1;
            double mostNegativeCost = -Epsilon;

            for (int j = 0; j < totalColumns - 1; j++)
            {
                if (matrix[0, j] < mostNegativeCost)
                {
                    mostNegativeCost = matrix[0, j];
                    enteringCol = j;
                }
            }

            // Se não existirem coeficientes estritamente negativos, a solução atual é ÓTIMA!
            if (enteringCol == -1)
            {
                // Regista iteração final de convergência
                iterations.Add(new SimplexIterationDto
                {
                    IterationNumber = iterationCount,
                    Tableau = CaptureTableauSnapshot(matrix, basicVars, colHeaders, totalRows, totalColumns),
                    HasPivot = false,
                    Explanation = $"Convergência alcançada na iteração {iterationCount}. Todos os custos reduzidos na Linha Z são não-negativos (c_j >= 0). A solução atual é ótima e estável."
                });
                break;
            }

            // PASSO B: Teste da Razão Mínima (Determinação da Linha Saint)
            // Theta_i = RHS_i / a_ik, para todo a_ik > 0
            int leavingRow = -1;
            double minRatio = double.MaxValue;
            var minimumRatios = new List<double?>();

            for (int i = 1; i < totalRows; i++)
            {
                double denominator = matrix[i, enteringCol];
                double rhs = matrix[i, totalColumns - 1];

                if (denominator > Epsilon)
                {
                    double ratio = rhs / denominator;
                    minimumRatios.Add(ratio);

                    if (ratio < minRatio - Epsilon)
                    {
                        minRatio = ratio;
                        leavingRow = i;
                    }
                }
                else
                {
                    minimumRatios.Add(null); // Denominador <= 0 não é candidato elegível
                }
            }

            // PASSO C: Deteção de Solução Ilimitada (Unbounded)
            // Se nenhum elemento da coluna entrante for estritamente positivo, a região viável é aberta na direção de crescimento de Z
            if (leavingRow == -1)
            {
                status = OptimizationStatus.Unbounded;
                statusMessage = $"Problema Ilimitado (Unbounded): A coluna entrante '{colHeaders[enteringCol]}' não possui coeficientes restritivos estritamente positivos. O lucro pode crescer infinitamente.";
                specialAnalysis.IsUnbounded = true;
                specialAnalysis.Notes = statusMessage;

                iterations.Add(new SimplexIterationDto
                {
                    IterationNumber = iterationCount,
                    Tableau = CaptureTableauSnapshot(matrix, basicVars, colHeaders, totalRows, totalColumns),
                    HasPivot = false,
                    PivotColumnIndex = enteringCol,
                    EnteringVariableName = colHeaders[enteringCol],
                    MinimumRatios = minimumRatios,
                    Explanation = statusMessage
                });
                break;
            }

            double pivotValue = matrix[leavingRow, enteringCol];
            string enteringVar = colHeaders[enteringCol];
            string leavingVar = basicVars[leavingRow];

            // Verifica degenerescência matemática (RHS = 0 resulta em razão 0)
            if (Math.Abs(matrix[leavingRow, totalColumns - 1]) < Epsilon)
            {
                specialAnalysis.IsDegenerate = true;
            }

            // Regista instantâneo antes do pivoteamento com coordenadas e razões
            iterations.Add(new SimplexIterationDto
            {
                IterationNumber = iterationCount,
                Tableau = CaptureTableauSnapshot(matrix, basicVars, colHeaders, totalRows, totalColumns),
                HasPivot = true,
                PivotRowIndex = leavingRow,
                PivotColumnIndex = enteringCol,
                PivotValue = pivotValue,
                EnteringVariableName = enteringVar,
                LeavingVariableName = leavingVar,
                MinimumRatios = minimumRatios,
                Explanation = $"Iteração {iterationCount}: Variável entrante '{enteringVar}' (custo reduzido: {matrix[0, enteringCol]:F2}) selecionada pela regra de Dantzig. Variável sainte '{leavingVar}' (razão mínima θ = {minRatio:F3}). Elemento Pivô = {pivotValue:F3} em [Linha {leavingRow}, Coluna {enteringVar}]."
            });

            // PASSO D: Pivoteamento Matricial de Gauss-Jordan Completo
            // 1. Normalização da linha pivô dividindo todos os seus termos pelo valor do pivô
            for (int c = 0; c < totalColumns; c++)
            {
                matrix[leavingRow, c] /= pivotValue;
            }

            // 2. Eliminação linear em todas as outras linhas (incluindo a linha 0 de Z)
            // Linha_i = Linha_i - (fator * Linha_pivô), onde fator = elemento na coluna entrante
            for (int r = 0; r < totalRows; r++)
            {
                if (r != leavingRow)
                {
                    double factor = matrix[r, enteringCol];
                    if (Math.Abs(factor) > Epsilon)
                    {
                        for (int c = 0; c < totalColumns; c++)
                        {
                            matrix[r, c] -= factor * matrix[leavingRow, c];
                            // Trunca resíduos microscópicos de precisão IEEE 754
                            if (Math.Abs(matrix[r, c]) < Epsilon)
                            {
                                matrix[r, c] = 0.0;
                            }
                        }
                    }
                }
            }

            // Atualiza base vetorial
            basicVars[leavingRow] = enteringVar;
            iterationCount++;
        }

        if (iterationCount >= request.MaxIterations && status == OptimizationStatus.Optimal)
        {
            status = OptimizationStatus.MaxIterationsExceeded;
            statusMessage = "Aviso: O número máximo de iterações foi atingido antes da confirmação de otimalidade.";
        }

        // PASSO E: Análise de Múltiplas Soluções Ótimas
        // Se para alguma variável não-básica o custo reduzido na Linha Z for igual a 0, existem vértices alternativos equivalentes.
        if (status == OptimizationStatus.Optimal)
        {
            for (int j = 0; j < totalColumns - 1; j++)
            {
                string colName = colHeaders[j];
                bool isBasic = basicVars.Skip(1).Contains(colName);
                if (!isBasic && Math.Abs(matrix[0, j]) < Epsilon)
                {
                    specialAnalysis.HasMultipleOptimalSolutions = true;
                    specialAnalysis.AlternateOptimaVariables.Add(colName);
                }
            }

            if (specialAnalysis.HasMultipleOptimalSolutions)
            {
                status = OptimizationStatus.MultipleOptimalSolutions;
                statusMessage = $"Solução Ótima Múltipla detectada: A(s) variável(is) não-básica(s) [{string.Join(", ", specialAnalysis.AlternateOptimaVariables)}] possui(em) custo reduzido zero, permitindo alocações alternativas com o mesmo lucro máximo.";
                specialAnalysis.Notes = statusMessage;
            }
        }

        // 4. Extração da Solução Ótima e Construção das Métricas
        double optimalProfit = Math.Round(matrix[0, totalColumns - 1], 4);
        var solutionDict = new Dictionary<string, double>();

        // Variáveis não básicas têm valor zero
        foreach (var col in colHeaders.Take(totalColumns - 1))
        {
            solutionDict[col] = 0.0;
        }

        // Variáveis básicas assumem os valores do RHS
        for (int i = 1; i < totalRows; i++)
        {
            string bVar = basicVars[i];
            solutionDict[bVar] = Math.Round(matrix[i, totalColumns - 1], 4);
        }

        // Mapeamento das Cargas (Variáveis de Decisão)
        var cargoAllocations = new List<CargoAllocationItem>();
        for (int j = 0; j < numVariables; j++)
        {
            var v = request.Variables[j];
            double qty = solutionDict.GetValueOrDefault(v.Code, 0.0);
            cargoAllocations.Add(new CargoAllocationItem
            {
                Code = v.Code,
                Name = v.Name,
                OptimalQuantity = Math.Max(0.0, qty),
                UnitProfit = v.ProfitCoefficient,
                TotalProfitContribution = Math.Round(qty * v.ProfitCoefficient, 2),
                Unit = v.Unit ?? "unid"
            });
        }

        // Mapeamento do Consumo de Recursos e Folgas dos Contentores
        var resourceUtilizations = new List<ResourceUtilizationItem>();
        for (int i = 0; i < numConstraints; i++)
        {
            var c = request.Constraints[i];
            double slack = solutionDict.GetValueOrDefault(c.SlackCode, 0.0);
            double consumed = Math.Max(0.0, c.CapacityRhs - slack);
            double percentage = c.CapacityRhs > 0 ? (consumed / c.CapacityRhs) * 100.0 : 0.0;

            resourceUtilizations.Add(new ResourceUtilizationItem
            {
                SlackCode = c.SlackCode,
                Name = c.Name,
                TotalCapacity = c.CapacityRhs,
                ConsumedAmount = Math.Round(consumed, 4),
                SlackRemaining = Math.Round(slack, 4),
                UtilizationPercentage = Math.Round(percentage, 2),
                Unit = c.Unit,
                IsBottleneck = slack < Epsilon // Se a folga for nula, o recurso é limitante (gargalo operacional)
            });
        }

        stopwatch.Stop();

        return new OptimizationResult
        {
            Success = status == OptimizationStatus.Optimal || status == OptimizationStatus.MultipleOptimalSolutions,
            Status = status,
            StatusMessage = statusMessage,
            OptimalProfit = Math.Max(0.0, optimalProfit),
            CargoAllocations = cargoAllocations,
            ResourceUtilizations = resourceUtilizations,
            SpecialAnalysis = specialAnalysis,
            Iterations = iterations,
            ExecutionTimeMs = stopwatch.Elapsed.TotalMilliseconds
        };
    }

    private static TableauStateDto CaptureTableauSnapshot(
        double[,] matrix,
        string[] basicVars,
        List<string> colHeaders,
        int totalRows,
        int totalColumns)
    {
        var rowList = new List<List<double>>();
        for (int r = 0; r < totalRows; r++)
        {
            var rowData = new List<double>();
            for (int c = 0; c < totalColumns; c++)
            {
                rowData.Add(Math.Round(matrix[r, c], 4));
            }
            rowList.Add(rowData);
        }

        return new TableauStateDto
        {
            ColumnHeaders = new List<string>(colHeaders),
            BasicVariableNames = basicVars.ToList(),
            Matrix = rowList
        };
    }

    private static void ValidateRequest(OptimizationRequest request)
    {
        if (request == null) throw new ArgumentNullException(nameof(request));
        if (request.Variables == null || request.Variables.Count == 0)
            throw new ArgumentException("Pelo menos uma variável de carga deve ser fornecida.");
        if (request.Constraints == null || request.Constraints.Count == 0)
            throw new ArgumentException("Pelo menos uma restrição deve ser fornecida.");
        if (request.TechnologyMatrix == null || request.TechnologyMatrix.Count != request.Constraints.Count)
            throw new ArgumentException("A dimensão da matriz tecnológica deve coincidir com o número de restrições.");

        for (int i = 0; i < request.TechnologyMatrix.Count; i++)
        {
            if (request.TechnologyMatrix[i].Count != request.Variables.Count)
            {
                throw new ArgumentException($"A linha {i + 1} da matriz tecnológica tem {request.TechnologyMatrix[i].Count} coeficientes, mas existem {request.Variables.Count} variáveis.");
            }
        }
    }
}

