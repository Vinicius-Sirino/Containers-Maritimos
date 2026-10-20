namespace PdaContainers.Application.DTOs;

/// <summary>
/// Instantâneo completo do tableau simplex numa determinada iteração.
/// </summary>
public class TableauStateDto
{
    public List<string> ColumnHeaders { get; set; } = new(); // [ "X1", "X2", ..., "S1", "S2", ..., "RHS" ]
    public List<string> BasicVariableNames { get; set; } = new(); // Nome da variável básica associada a cada linha i (ex: "S1", "X2")
    public List<List<double>> Matrix { get; set; } = new(); // Linha 0 = Equação Z; Linhas 1..m = Restrições
}

/// <summary>
/// Registo detalhado da iteração do Simplex, permitindo inspeção pedagógica e auditoria.
/// </summary>
public class SimplexIterationDto
{
    public int IterationNumber { get; set; }
    public TableauStateDto Tableau { get; set; } = new();
    
    // Identificação dos elementos pivô (se não for o estado terminal)
    public bool HasPivot { get; set; }
    public int PivotRowIndex { get; set; } = -1; // Índice na matriz (1..m)
    public int PivotColumnIndex { get; set; } = -1; // Índice na matriz (0..totalCols-2)
    public double PivotValue { get; set; }
    public string EnteringVariableName { get; set; } = string.Empty; // Variável que entra na base
    public string LeavingVariableName { get; set; } = string.Empty; // Variável que sai da base
    
    // Vetor de testes da razão mínima (Theta): [RHS / a_ik] para cada linha de restrição
    public List<double?> MinimumRatios { get; set; } = new();

    /// <summary>
    /// Explicação pedagógica contextual dos critérios de decisão matemática aplicados no passo.
    /// </summary>
    public string Explanation { get; set; } = string.Empty;
}

