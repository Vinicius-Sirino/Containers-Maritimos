import React from 'react';
import { TrendingUp, Package, AlertTriangle, CheckCircle2, Clock, Info } from 'lucide-react';
import { OptimizationResult } from '../types/optimizer';

interface KpiMetricsProps {
  result: OptimizationResult;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({ result }) => {
  return (
    <div className="space-y-6">
      {/* Alerta de status especial se não for ótimo simples */}
      {result.specialAnalysis.hasMultipleOptimalSolutions && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 p-4 rounded-xl flex items-start space-x-3">
          <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Múltiplas Soluções Ótimas Disponíveis:</span> O modelo
            atingiu o lucro máximo de{' '}
            <strong className="underline">€{result.optimalProfit.toLocaleString('pt-PT')}</strong>,
            mas as variáveis não-básicas{' '}
            <code>[{result.specialAnalysis.alternateOptimaVariables.join(', ')}]</code> possuem
            custo reduzido zero. Existem outras combinações de carga com o mesmo retorno financeiro.
          </div>
        </div>
      )}

      {result.status === 'Unbounded' && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-900 dark:text-red-200 p-4 rounded-xl flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Solução Ilimitada (Unbounded):</span> Região de
            soluções viáveis não possui barreira limitante para a direção do vetor lucro. Adicione
            restrições operacionais adicionais.
          </div>
        </div>
      )}

      {/* Cartões Principais de KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lucro Ótimo Z* */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-15">
            <TrendingUp className="w-20 h-20" />
          </div>
          <div className="text-xs uppercase tracking-wider font-semibold text-blue-100 mb-1">
            Margem de Contribuição Ótima ($Z^*$)
          </div>
          <div className="text-3xl font-extrabold tracking-tight">
            €{result.optimalProfit.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-3 flex items-center space-x-2 text-xs text-blue-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Resolvido em {result.executionTimeMs.toFixed(2)} ms ({result.totalIterations} iterações Simplex)</span>
          </div>
        </div>

        {/* Quantidade Total de Carga Alocada */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
            Unidades Totais Estivadas
          </div>
          <div className="text-3xl font-bold text-foreground">
            {result.cargoAllocations
              .reduce((acc, c) => acc + c.optimalQuantity, 0)
              .toLocaleString('pt-PT', { maximumFractionDigits: 2 })}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Mix recomendado entre {result.cargoAllocations.filter((c) => c.optimalQuantity > 0).length} categorias de carga
          </div>
        </div>

        {/* Estado da Convergência */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
            Estado de Resolução
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span
              className={`inline-block w-3 h-3 rounded-full ${
                result.success ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
            <span className="text-lg font-bold text-foreground capitalize">
              {result.status === 'Optimal' ? 'Ótimo Global' : result.status}
            </span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
            {result.statusMessage}
          </div>
        </div>
      </div>

      {/* Cartões com as Quantidades Recomendadas por Lote de Carga (Xn) */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center space-x-2">
          <Package className="w-4 h-4 text-blue-500" />
          <span>Alocação Recomendada por Tipo de Carga ($X_n$)</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {result.cargoAllocations.map((item) => (
            <div
              key={item.code}
              className={`p-4 rounded-lg border transition-all ${
                item.optimalQuantity > 0
                  ? 'border-blue-500/30 bg-blue-500/5 dark:bg-blue-950/20 shadow-sm'
                  : 'border-border/60 bg-muted/20 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-muted text-foreground">
                  {item.code}
                </span>
                <span className="text-xs text-muted-foreground">€{item.unitProfit}/unid</span>
              </div>
              <div className="font-semibold text-sm text-foreground truncate" title={item.name}>
                {item.name}
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                    {item.optimalQuantity.toLocaleString('pt-PT', { maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Contribuição</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    €{item.totalProfitContribution.toLocaleString('pt-PT')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ocupação e Utilização de Capacidade (Taxa de Peso vs Volume vs Folgas) */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Taxas de Ocupação & Capacidade Sobrante do Contentor (Folgas $S_m$)
        </h4>
        <div className="space-y-4">
          {result.resourceUtilizations.map((res) => {
            const isFull = res.utilizationPercentage >= 99.9;
            return (
              <div key={res.slackCode} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-muted">
                      {res.slackCode}
                    </span>
                    <span className="font-medium text-foreground">{res.name}</span>
                    {res.isBottleneck && (
                      <span className="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border border-red-200 dark:border-red-900">
                        Gargalo Ativo (100%)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {res.consumedAmount.toLocaleString('pt-PT', { maximumFractionDigits: 2 })} /{' '}
                      {res.totalCapacity} {res.unit}
                    </span>{' '}
                    ({res.utilizationPercentage.toFixed(1)}%)
                  </div>
                </div>

                {/* Barra de Progresso com Transição Suave */}
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isFull
                        ? 'bg-red-500'
                        : res.utilizationPercentage > 85
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(res.utilizationPercentage, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-muted-foreground px-0.5">
                  <span>Consumo: {res.consumedAmount} {res.unit}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    Folga Disponível: {res.slackRemaining} {res.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

