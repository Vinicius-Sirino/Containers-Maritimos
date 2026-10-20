import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CargoConfigTable } from './components/CargoConfigTable';
import { KpiMetrics } from './components/KpiMetrics';
import { GraphicalMethod } from './components/GraphicalMethod';
import { TableauInspector } from './components/TableauInspector';
import { CargoVariableInput, ConstraintInput, OptimizationRequest, OptimizationResult } from './types/optimizer';
import { solveSimplex } from './services/api';
import { solveSimplexLocally } from './utils/localSimplexEngine';
import { Shield, Sparkles, AlertCircle } from 'lucide-react';

const BENCHMARK_PDA_40FT: OptimizationRequest = {
  scenarioName: "Contentor 40' High Cube - PDA Fleet Benchmark",
  variables: [
    { code: 'X1', name: 'Maquinário Pesado', profitCoefficient: 3000, unit: 'unid' },
    { code: 'X2', name: 'Peças Automotivas', profitCoefficient: 2700, unit: 'paletes' },
    { code: 'X3', name: 'Eletrônicos & Chips', profitCoefficient: 3700, unit: 'lotes' },
    { code: 'X4', name: 'Têxteis e Roupas', profitCoefficient: 2750, unit: 'fardos' },
  ],
  constraints: [
    { slackCode: 'S1', name: 'Peso Máximo (Payload)', capacityRhs: 48.0, unit: 'toneladas' },
    { slackCode: 'S2', name: 'Volume do Container (Espaço)', capacityRhs: 55.0, unit: 'm³' },
    { slackCode: 'S3', name: 'Pontos de Amarração (Peação)', capacityRhs: 54.0, unit: 'pontos' },
    { slackCode: 'S4', name: 'Horas de Estiva (Equipe)', capacityRhs: 44.0, unit: 'horas' },
  ],
  technologyMatrix: [
    [6.0, 2.0, 2.0, 2.0], // Peso
    [5.0, 2.0, 5.0, 1.0], // Volume
    [2.0, 4.0, 6.0, 1.0], // Pontos de Peação
    [1.0, 2.0, 2.0, 6.0], // Horas de Estiva
  ],
  maxIterations: 50,
};

export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [variables, setVariables] = useState<CargoVariableInput[]>(BENCHMARK_PDA_40FT.variables);
  const [constraints, setConstraints] = useState<ConstraintInput[]>(BENCHMARK_PDA_40FT.constraints);
  const [technologyMatrix, setTechnologyMatrix] = useState<number[][]>(BENCHMARK_PDA_40FT.technologyMatrix);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [backendMode, setBackendMode] = useState<'api' | 'local'>('local');

  useEffect(() => {
    // Aplica classe dark no elemento html raiz
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Executa otimização inicial ao carregar a página
  useEffect(() => {
    handleSolve();
  }, []);

  const handleLoadPreset = () => {
    setVariables(BENCHMARK_PDA_40FT.variables);
    setConstraints(BENCHMARK_PDA_40FT.constraints);
    setTechnologyMatrix(BENCHMARK_PDA_40FT.technologyMatrix);
  };

  const handleSolve = async () => {
    setIsLoading(true);
    const request: OptimizationRequest = {
      scenarioName: 'Alocação Otimizada PDA Containers',
      variables,
      constraints,
      technologyMatrix,
      maxIterations: 60,
    };

    try {
      // Tenta chamar o backend C# .NET 8 Web API
      const apiResult = await solveSimplex(request);
      setResult(apiResult);
      setBackendMode('api');
    } catch {
      // Fallback transparente para o motor Simplex client-side idêntico
      const localResult = solveSimplexLocally(request);
      setResult(localResult);
      setBackendMode('local');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors selection:bg-blue-500 selection:text-white">
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onLoadPreset={handleLoadPreset}
        onSolve={handleSolve}
        isLoading={isLoading}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner de Boas-Vindas e Status do Motor */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-muted/40 p-4 rounded-xl border border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-foreground">
                Plataforma de Otimização Operacional — Frota PDA Containers
              </h2>
              <p className="text-xs text-muted-foreground">
                Inspirado em soluções corporativas (Zebra Workcloud & Optware). Motor Simplex puro de 1 Fase.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-muted-foreground">Engine Ativa:</span>
            <span
              className={`px-2 py-0.5 rounded-full font-mono font-semibold ${
                backendMode === 'api'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300'
              }`}
            >
              {backendMode === 'api' ? 'C# .NET 8 Web API (Remoto)' : 'Simplex Engine (WASM/Local)'}
            </span>
          </div>
        </div>

        {/* Formulários e Tabelas de Configuração */}
        <CargoConfigTable
          variables={variables}
          constraints={constraints}
          technologyMatrix={technologyMatrix}
          onVariablesChange={setVariables}
          onConstraintsChange={setConstraints}
          onMatrixChange={setTechnologyMatrix}
        />

        {/* Dashboard de KPIs e Resultados */}
        {result && <KpiMetrics result={result} />}

        {/* Método Gráfico de Programação Linear (2D) */}
        {result && (
          <GraphicalMethod
            variables={variables}
            constraints={constraints}
            technologyMatrix={technologyMatrix}
            result={result}
          />
        )}

        {/* Inspetor Visual do Tableau Passo a Passo */}
        {result && <TableauInspector iterations={result.iterations} />}
      </main>

      <footer className="border-t border-border mt-12 py-6 text-center text-xs text-muted-foreground">
        <p>PDA Containers &copy; 2026. Sistema de Otimização e Estivagem Logística de Contentores.</p>
        <p className="mt-1">
          Arquitetura Limpa (Clean Architecture), Princípios SOLID e Investigação Operacional Rigorosa.
        </p>
      </footer>
    </div>
  );
};
export default App;

