using PdaContainers.Domain.Enums;

namespace PdaContainers.Application.DTOs;

public class CargoAllocationItem
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public double OptimalQuantity { get; set; }
    public double UnitProfit { get; set; }
    public double TotalProfitContribution { get; set; }
    public string Unit { get; set; } = string.Empty;
}

public class ResourceUtilizationItem
{
    public string SlackCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public double TotalCapacity { get; set; }
    public double ConsumedAmount { get; set; }
    public double SlackRemaining { get; set; }
    public double UtilizationPercentage { get; set; }
    public string Unit { get; set; } = string.Empty;
    public bool IsBottleneck { get; set; } // Variável básica de folga = 0 (recurso limitante / preço-sombra ativo)
}

public class SpecialAnalysisDto
{
    public bool HasMultipleOptimalSolutions { get; set; }
    public List<string> AlternateOptimaVariables { get; set; } = new();
    public bool IsUnbounded { get; set; }
    public bool IsDegenerate { get; set; }
    public string Notes { get; set; } = string.Empty;
}

public class OptimizationResult
{
    public bool Success { get; set; }
    public OptimizationStatus Status { get; set; }
    public string StatusMessage { get; set; } = string.Empty;
    public double OptimalProfit { get; set; }
    
    public List<CargoAllocationItem> CargoAllocations { get; set; } = new();
    public List<ResourceUtilizationItem> ResourceUtilizations { get; set; } = new();
    
    public SpecialAnalysisDto SpecialAnalysis { get; set; } = new();
    
    public List<SimplexIterationDto> Iterations { get; set; } = new();
    public int TotalIterations => Iterations.Count;
    public double ExecutionTimeMs { get; set; }
    public DateTime SolvedAt { get; set; } = DateTime.UtcNow;
}

