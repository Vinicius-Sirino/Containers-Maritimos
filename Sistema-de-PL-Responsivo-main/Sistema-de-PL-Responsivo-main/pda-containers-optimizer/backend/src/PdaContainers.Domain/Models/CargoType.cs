namespace PdaContainers.Domain.Models;

/// <summary>
/// Representa um tipo de carga candidata à estivagem no contentor.
/// Corresponde à variável de decisão X_j no modelo de Programação Linear.
/// </summary>
public class CargoType
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty; // Ex: X1, X2...
    public decimal UnitProfit { get; set; } // Coeficiente c_j na função objetivo Z
    public Dictionary<string, decimal> ResourceConsumptions { get; set; } = new(); // a_ij para cada restrição
    public string? Description { get; set; }
}

