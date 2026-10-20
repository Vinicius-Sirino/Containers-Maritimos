import React, { useState } from 'react';
import { Eye, ChevronRight, ChevronLeft, ArrowRight, BookOpen, Target, CheckCircle } from 'lucide-react';
import { SimplexIterationDto } from '../types/optimizer';

interface TableauInspectorProps {
  iterations: SimplexIterationDto[];
}

export const TableauInspector: React.FC<TableauInspectorProps> = ({ iterations }) => {
  const [selectedIterationIndex, setSelectedIterationIndex] = useState(0);

  if (!iterations || iterations.length === 0) {
    return null;
  }

  const currentIteration = iterations[selectedIterationIndex] || iterations[0];
  const { tableau, hasPivot, pivotRowIndex, pivotColumnIndex, pivotValue, explanation, minimumRatios } =
    currentIteration;

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-foreground text-base">
            3. Inspetor Visual do Tableau (Passo a Passo Académico)
          </h3>
        </div>

        {/* Stepper / Timeline de Iterações */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedIterationIndex((prev) => Math.max(0, prev - 1))}
            disabled={selectedIterationIndex === 0}
            className="p-1.5 rounded-lg border border-input bg-background hover:bg-muted text-foreground disabled:opacity-30 transition-colors"
            title="Iteração anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {iterations.map((iter, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIterationIndex(idx)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                idx === selectedIterationIndex
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {idx === 0
                ? 'Tab. Inicial'
                : idx === iterations.length - 1
                ? 'Ótimo Final'
                : `Iteração ${idx}`}
            </button>
          ))}

          <button
            onClick={() =>
              setSelectedIterationIndex((prev) => Math.min(iterations.length - 1, prev + 1))
            }
            disabled={selectedIterationIndex === iterations.length - 1}
            className="p-1.5 rounded-lg border border-input bg-background hover:bg-muted text-foreground disabled:opacity-30 transition-colors"
            title="Próxima iteração"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Caixa Explicativa Contextual */}
      <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-lg p-4 text-sm text-indigo-950 dark:text-indigo-200 flex items-start space-x-3">
        <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold flex items-center space-x-2">
            <span>
              {hasPivot
                ? `Pivoteamento Gauss-Jordan (Passo ${currentIteration.IterationNumber + 1})`
                : 'Critério de Paragem / Solução Final'}
            </span>
            {hasPivot && (
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-200/60 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-300 font-mono">
                Entra: {currentIteration.EnteringVariableName} &rarr; Sai: {currentIteration.LeavingVariableName}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-indigo-900/80 dark:text-indigo-300/90 leading-relaxed">
            {explanation}
          </p>
        </div>
      </div>

      {/* Tabela do Tableau Selecionado */}
      <div className="overflow-x-auto border border-border/80 rounded-lg">
        <table className="w-full border-collapse text-xs sm:text-sm font-mono text-center">
          <thead>
            <tr className="bg-muted/80 text-muted-foreground border-b border-border text-xs uppercase tracking-wider">
              <th className="py-2.5 px-3 text-left font-sans">Base</th>
              {tableau.columnHeaders.map((col, cIdx) => {
                const isEnteringCol = hasPivot && cIdx === pivotColumnIndex;
                return (
                  <th
                    key={col}
                    className={`py-2.5 px-3 transition-colors ${
                      isEnteringCol
                        ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold border-x border-blue-500/30'
                        : ''
                    }`}
                  >
                    {col}
                    {isEnteringCol && <span className="block text-[10px] text-blue-600">&darr; Entra</span>}
                  </th>
                );
              })}
              {hasPivot && <th className="py-2.5 px-3 font-sans text-muted-foreground">Razão (&theta;)</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {tableau.matrix.map((row, rIdx) => {
              const isZRow = rIdx === 0;
              const isPivotRow = hasPivot && rIdx === pivotRowIndex;
              const basicVarName = tableau.basicVariableNames[rIdx] || (isZRow ? 'Z' : `L${rIdx}`);
              const ratio = minimumRatios?.[rIdx - 1];

              return (
                <tr
                  key={rIdx}
                  className={`transition-colors ${
                    isZRow
                      ? 'bg-muted/30 font-semibold'
                      : isPivotRow
                      ? 'bg-amber-500/10 dark:bg-amber-950/20'
                      : 'hover:bg-muted/20'
                  }`}
                >
                  {/* Nome da Variável Básica */}
                  <td className="py-2.5 px-3 text-left font-sans font-bold text-foreground">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs ${
                        isZRow
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                          : isPivotRow
                          ? 'bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {basicVarName}
                    </span>
                    {isPivotRow && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 ml-1.5 font-normal">
                        &larr; Sai
                      </span>
                    )}
                  </td>

                  {/* Células do Tableau */}
                  {row.map((val, cIdx) => {
                    const isPivotCell = isPivotRow && cIdx === pivotColumnIndex;
                    const isEnteringCol = hasPivot && cIdx === pivotColumnIndex;

                    return (
                      <td
                        key={cIdx}
                        className={`py-2.5 px-3 transition-colors ${
                          isPivotCell
                            ? 'bg-amber-500 text-white font-extrabold rounded shadow-inner scale-105 inline-table'
                            : isEnteringCol
                            ? 'bg-blue-500/10 font-semibold text-blue-700 dark:text-blue-300 border-x border-blue-500/20'
                            : isPivotRow
                            ? 'text-amber-900 dark:text-amber-200 font-medium'
                            : isZRow
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {val.toFixed(2)}
                      </td>
                    );
                  })}

                  {/* Coluna da Razão Mínima Theta */}
                  {hasPivot && (
                    <td className="py-2.5 px-3 text-muted-foreground text-xs font-mono">
                      {isZRow
                        ? '—'
                        : ratio !== null && ratio !== undefined
                        ? ratio.toFixed(2)
                        : '<= 0 (Ineligível)'}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legenda de Auditoria */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded bg-amber-500 inline-block" />
          <span>Célula Pivô Selecionada ($P$)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded bg-blue-500/20 border border-blue-500/40 inline-block" />
          <span>Coluna Entrante (Mais negativo em Z)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded bg-amber-500/10 border border-amber-500/30 inline-block" />
          <span>Linha Sainte (Menor razão positiva &theta;)</span>
        </div>
      </div>
    </div>
  );
};

