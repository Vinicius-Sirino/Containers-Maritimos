using PdaContainers.Application.DTOs;

namespace PdaContainers.Application.Interfaces;

/// <summary>
/// Contrato do serviço de resolução do modelo linear via Simplex Tabular.
/// </summary>
public interface ISimplexSolverService
{
    /// <summary>
    /// Resolve o problema de maximização com restrições lineares de menor ou igual (\le).
    /// Executa o algoritmo tabular de 1 fase do zero, sem bibliotecas externas.
    /// </summary>
    /// <param name="request">Dados do problema (função objetivo, limites e matriz tecnológica).</param>
    /// <returns>Resultado completo com a solução ótima, métricas de ocupação e histórico de iterações.</returns>
    OptimizationResult Solve(OptimizationRequest request);
}

