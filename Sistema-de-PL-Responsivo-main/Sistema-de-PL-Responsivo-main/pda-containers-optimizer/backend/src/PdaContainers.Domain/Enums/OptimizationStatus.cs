namespace PdaContainers.Domain.Enums;

/// <summary>
/// Representa o estado final de resolução do algoritmo Simplex.
/// </summary>
public enum OptimizationStatus
{
    Optimal,
    Unbounded,
    MultipleOptimalSolutions,
    Infeasible,
    MaxIterationsExceeded
}

