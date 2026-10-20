using System.ComponentModel.DataAnnotations;

namespace PdaContainers.Application.DTOs;

/// <summary>
/// Requisição para resolução do modelo de otimização linear simplex.
/// </summary>
public class OptimizationRequest
{
    [Required]
    public string ScenarioName { get; set; } = "Cenário PDA Containers";

    [Required]
    [MinLength(1, ErrorMessage = "Pelo menos um tipo de carga (variável X_n) deve ser especificado.")]
    public List<CargoVariableInput> Variables { get; set; } = new();

    [Required]
    [MinLength(1, ErrorMessage = "Pelo menos uma restrição (R_m) deve ser especificada.")]
    public List<ConstraintInput> Constraints { get; set; } = new();

    /// <summary>
    /// Matriz de coeficientes tecnológicos a_ij: [numRestricoes x numVariaveis].
    /// A linha i corresponde à restrição i, e a coluna j corresponde à variável j.
    /// </summary>
    [Required]
    public List<List<double>> TechnologyMatrix { get; set; } = new();

    /// <summary>
    /// Limite máximo de iterações para prevenir ciclos em casos degenerados.
    /// </summary>
    public int MaxIterations { get; set; } = 100;
}

public class CargoVariableInput
{
    [Required]
    public string Code { get; set; } = "X1";

    [Required]
    public string Name { get; set; } = "Carga";

    /// <summary>
    /// Coeficiente de lucro/margem de contribuição c_j no vetor da função objetivo.
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "A margem de lucro não pode ser negativa.")]
    public double ProfitCoefficient { get; set; }

    public string? Unit { get; set; } = "unidades";
}

public class ConstraintInput
{
    [Required]
    public string SlackCode { get; set; } = "S1";

    [Required]
    public string Name { get; set; } = "Capacidade de Peso";

    /// <summary>
    /// Lado direito da restrição (RHS - Right Hand Side), b_i.
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "A capacidade disponível não pode ser negativa.")]
    public double CapacityRhs { get; set; }

    public string Unit { get; set; } = "t";
}

