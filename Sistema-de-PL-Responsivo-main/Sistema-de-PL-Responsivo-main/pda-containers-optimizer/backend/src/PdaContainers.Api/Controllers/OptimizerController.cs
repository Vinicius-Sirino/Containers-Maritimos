using Microsoft.AspNetCore.Mvc;
using PdaContainers.Application.DTOs;
using PdaContainers.Application.Interfaces;

namespace PdaContainers.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class OptimizerController : ControllerBase
{
    private readonly ISimplexSolverService _solverService;
    private readonly ILogger<OptimizerController> _logger;

    public OptimizerController(ISimplexSolverService solverService, ILogger<OptimizerController> logger)
    {
        _solverService = solverService;
        _logger = logger;
    }

    /// <summary>
    /// Executa a otimização de estivagem e alocação de cargas no contentor via Simplex Tabular puro.
    /// </summary>
    /// <param name="request">Definição das variáveis de carga, limites operacionais e matriz de consumo de recursos.</param>
    /// <returns>Solução ótima com quantitativos, taxas de ocupação e histórico passo a passo dos tableaus.</returns>
    /// <response code="200">Otimização concluída com sucesso (ótimo encontrado, ilimitado ou soluções múltiplas).</response>
    /// <response code="400">Dados da requisição inválidos ou matriz inconsistente.</response>
    [HttpPost("solve")]
    [ProducesResponseType(typeof(OptimizationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult<OptimizationResult> Solve([FromBody] OptimizationRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            _logger.LogInformation("Iniciando resolução Simplex para o cenário: {ScenarioName}", request.ScenarioName);
            var result = _solverService.Solve(request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Falha de validação no modelo Simplex");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro interno durante a resolução do Simplex");
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Ocorreu um erro interno durante a otimização." });
        }
    }

    /// <summary>
    /// Retorna o cenário padrão pré-configurado da frota PDA Containers (Contentor 40 Pés High Cube).
    /// </summary>
    [HttpGet("preset/40ft-container")]
    [ProducesResponseType(typeof(OptimizationRequest), StatusCodes.Status200OK)]
    public ActionResult<OptimizationRequest> Get40FtContainerPreset()
    {
        var preset = new OptimizationRequest
        {
            ScenarioName = "Contentor 40' High Cube - PDA Fleet Benchmark",
            Variables = new List<CargoVariableInput>
            {
                new() { Code = "X1", Name = "Maquinário Pesado Industrial", ProfitCoefficient = 2800, Unit = "unid" },
                new() { Code = "X2", Name = "Peças Automotivas em Paletes", ProfitCoefficient = 1400, Unit = "paletes" },
                new() { Code = "X3", Name = "Eletrónicos e Componentes", ProfitCoefficient = 3200, Unit = "lotes" },
                new() { Code = "X4", Name = "Têxteis e Vestuário Premium", ProfitCoefficient = 1900, Unit = "fardos" }
            },
            Constraints = new List<ConstraintInput>
            {
                new() { SlackCode = "S1", Name = "Carga Útil Máxima (Payload)", CapacityRhs = 26.5, Unit = "toneladas" },
                new() { SlackCode = "S2", Name = "Volume Interno Útil", CapacityRhs = 76.0, Unit = "m³" },
                new() { SlackCode = "S3", Name = "Capacidade de Peação / Fixação", CapacityRhs = 120.0, Unit = "pontos" }
            },
            TechnologyMatrix = new List<List<double>>
            {
                // Restrição 1: Peso (ton por unidade de cada carga) -> limite 26.5 t
                new() { 4.5, 1.8, 1.2, 0.8 },
                // Restrição 2: Volume (m³ por unidade de cada carga) -> limite 76.0 m³
                new() { 6.0, 5.5, 8.0, 7.2 },
                // Restrição 3: Pontos de Peação (tensão e fixação) -> limite 120 pontos
                new() { 20.0, 10.0, 12.0, 8.0 }
            },
            MaxIterations = 50
        };

        return Ok(preset);
    }
}

