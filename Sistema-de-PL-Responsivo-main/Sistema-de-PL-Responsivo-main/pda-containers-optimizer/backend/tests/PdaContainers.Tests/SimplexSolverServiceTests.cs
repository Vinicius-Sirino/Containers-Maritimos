using PdaContainers.Application.DTOs;
using PdaContainers.Application.Services;
using PdaContainers.Domain.Enums;
using Xunit;

namespace PdaContainers.Tests;

public class SimplexSolverServiceTests
{
    private readonly SimplexSolverService _solver = new();

    [Fact]
    public void Solve_StandardTextbookProblem_FindsOptimalSolution()
    {
        // Max Z = 3*X1 + 5*X2
        // s.a:
        //  X1 <= 4          (S1)
        //  2*X2 <= 12       (S2)
        //  3*X1 + 2*X2 <= 18(S3)
        // Solução ótima conhecida: X1 = 2, X2 = 6, Z = 36
        var request = new OptimizationRequest
        {
            ScenarioName = "Problema Clássico de Produção",
            Variables = new List<CargoVariableInput>
            {
                new() { Code = "X1", Name = "Produto 1", ProfitCoefficient = 3 },
                new() { Code = "X2", Name = "Produto 2", ProfitCoefficient = 5 }
            },
            Constraints = new List<ConstraintInput>
            {
                new() { SlackCode = "S1", Name = "Corte", CapacityRhs = 4 },
                new() { SlackCode = "S2", Name = "Pintura", CapacityRhs = 12 },
                new() { SlackCode = "S3", Name = "Montagem", CapacityRhs = 18 }
            },
            TechnologyMatrix = new List<List<double>>
            {
                new() { 1.0, 0.0 },
                new() { 0.0, 2.0 },
                new() { 3.0, 2.0 }
            }
        };

        var result = _solver.Solve(request);

        Assert.Equal(OptimizationStatus.Optimal, result.Status);
        Assert.Equal(36.0, result.OptimalProfit, precision: 2);
        
        var x1 = result.CargoAllocations.First(c => c.Code == "X1");
        var x2 = result.CargoAllocations.First(c => c.Code == "X2");
        Assert.Equal(2.0, x1.OptimalQuantity, precision: 2);
        Assert.Equal(6.0, x2.OptimalQuantity, precision: 2);
        Assert.NotEmpty(result.Iterations);
    }

    [Fact]
    public void Solve_PdaContainer40FtBenchmark_FindsOptimalCargoMix()
    {
        var request = new OptimizationRequest
        {
            ScenarioName = "Contentor 40' High Cube - PDA Fleet Benchmark",
            Variables = new List<CargoVariableInput>
            {
                new() { Code = "X1", Name = "Maquinário Pesado", ProfitCoefficient = 2800 },
                new() { Code = "X2", Name = "Peças Automotivas", ProfitCoefficient = 1400 },
                new() { Code = "X3", Name = "Eletrónicos", ProfitCoefficient = 3200 },
                new() { Code = "X4", Name = "Têxteis", ProfitCoefficient = 1900 }
            },
            Constraints = new List<ConstraintInput>
            {
                new() { SlackCode = "S1", Name = "Peso (t)", CapacityRhs = 26.5 },
                new() { SlackCode = "S2", Name = "Volume (m³)", CapacityRhs = 76.0 },
                new() { SlackCode = "S3", Name = "Pontos Peação", CapacityRhs = 120.0 }
            },
            TechnologyMatrix = new List<List<double>>
            {
                new() { 4.5, 1.8, 1.2, 0.8 },
                new() { 6.0, 5.5, 8.0, 7.2 },
                new() { 20.0, 10.0, 12.0, 8.0 }
            }
        };

        var result = _solver.Solve(request);

        Assert.True(result.Success);
        Assert.True(result.OptimalProfit > 0);
        Assert.All(result.ResourceUtilizations, r => Assert.True(r.UtilizationPercentage <= 100.0001));
    }

    [Fact]
    public void Solve_UnboundedProblem_CorrectlyDetectsUnboundedStatus()
    {
        // Max Z = 2*X1 + X2
        // s.a:
        //  X1 - X2 <= 10 (S1)
        //  (sem teto superior para X2)
        var request = new OptimizationRequest
        {
            ScenarioName = "Problema Ilimitado",
            Variables = new List<CargoVariableInput>
            {
                new() { Code = "X1", Name = "Carga A", ProfitCoefficient = 2 },
                new() { Code = "X2", Name = "Carga B", ProfitCoefficient = 1 }
            },
            Constraints = new List<ConstraintInput>
            {
                new() { SlackCode = "S1", Name = "Restrição 1", CapacityRhs = 10 }
            },
            TechnologyMatrix = new List<List<double>>
            {
                new() { 1.0, -1.0 }
            }
        };

        var result = _solver.Solve(request);

        Assert.Equal(OptimizationStatus.Unbounded, result.Status);
        Assert.True(result.SpecialAnalysis.IsUnbounded);
    }
}

