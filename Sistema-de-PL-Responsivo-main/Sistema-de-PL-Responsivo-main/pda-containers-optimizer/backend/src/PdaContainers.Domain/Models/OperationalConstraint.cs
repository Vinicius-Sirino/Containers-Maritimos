namespace PdaContainers.Domain.Models;

/// <summary>
/// Representa uma restrição física, operacional ou regulamentar do contentor.
/// Corresponde a uma linha de restrição \sum a_{ij} X_j \le b_i com variável de folga S_i.
/// </summary>
public class OperationalConstraint
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string SlackCode { get; set; } = string.Empty; // Ex: S1, S2...
    public string Unit { get; set; } = string.Empty; // Ex: t, m³, horas, €
    public decimal Capacity { get; set; } // Valor do lado direito (b_i)
    public string? Description { get; set; }
}

