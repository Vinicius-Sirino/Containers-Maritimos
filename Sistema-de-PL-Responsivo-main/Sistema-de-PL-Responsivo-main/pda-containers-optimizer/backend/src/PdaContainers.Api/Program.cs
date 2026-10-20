using PdaContainers.Application.Interfaces;
using PdaContainers.Application.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "PDA Containers - Logistics Optimization API",
        Version = "v1",
        Description = "Motor de Pesquisa Operacional e Alocação de Cargas via Simplex Tabular de 1 Fase (Sem bibliotecas externas)."
    });
});

// Injeção de dependência do motor matemático
builder.Services.AddScoped<ISimplexSolverService, SimplexSolverService>();

// Política de CORS permissiva para desenvolvimento SPA
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "PDA Containers Optimizer API v1");
    });
}

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();

