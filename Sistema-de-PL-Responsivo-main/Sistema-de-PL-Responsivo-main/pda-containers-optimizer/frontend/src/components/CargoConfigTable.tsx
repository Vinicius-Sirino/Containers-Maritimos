import React from 'react';
import { Plus, Trash2, Layers, ShieldCheck, Scale, Box, Anchor } from 'lucide-react';
import { CargoVariableInput, ConstraintInput } from '../types/optimizer';

interface CargoConfigTableProps {
  variables: CargoVariableInput[];
  constraints: ConstraintInput[];
  technologyMatrix: number[][];
  onVariablesChange: (variables: CargoVariableInput[]) => void;
  onConstraintsChange: (constraints: ConstraintInput[]) => void;
  onMatrixChange: (matrix: number[][]) => void;
}

export const CargoConfigTable: React.FC<CargoConfigTableProps> = ({
  variables,
  constraints,
  technologyMatrix,
  onVariablesChange,
  onConstraintsChange,
  onMatrixChange,
}) => {
  const handleProfitChange = (index: number, value: number) => {
    const updated = [...variables];
    updated[index].profitCoefficient = value;
    onVariablesChange(updated);
  };

  const handleVariableNameChange = (index: number, name: string) => {
    const updated = [...variables];
    updated[index].name = name;
    onVariablesChange(updated);
  };

  const handleCapacityChange = (index: number, value: number) => {
    const updated = [...constraints];
    updated[index].capacityRhs = value;
    onConstraintsChange(updated);
  };

  const handleConstraintNameChange = (index: number, name: string) => {
    const updated = [...constraints];
    updated[index].name = name;
    onConstraintsChange(updated);
  };

  const handleMatrixCellChange = (rowIndex: number, colIndex: number, value: number) => {
    const updated = technologyMatrix.map((row, r) =>
      row.map((val, c) => (r === rowIndex && c === colIndex ? value : val))
    );
    onMatrixChange(updated);
  };

  const addVariable = () => {
    const nextIdx = variables.length + 1;
    const newCode = `X${nextIdx}`;
    const newVar: CargoVariableInput = {
      code: newCode,
      name: `Nova Carga ${nextIdx}`,
      profitCoefficient: 1500,
      unit: 'unid',
    };
    onVariablesChange([...variables, newVar]);

    // Atualiza a matriz tecnológica adicionando 1 coluna em todas as linhas
    const newMatrix = technologyMatrix.map((row) => [...row, 1.0]);
    onMatrixChange(newMatrix);
  };

  const removeVariable = (colIdx: number) => {
    if (variables.length <= 1) return;
    const newVars = variables.filter((_, idx) => idx !== colIdx);
    onVariablesChange(newVars);

    const newMatrix = technologyMatrix.map((row) => row.filter((_, idx) => idx !== colIdx));
    onMatrixChange(newMatrix);
  };

  const addConstraint = () => {
    const nextIdx = constraints.length + 1;
    const newCode = `S${nextIdx}`;
    const newConstraint: ConstraintInput = {
      slackCode: newCode,
      name: `Limite Operacional ${nextIdx}`,
      capacityRhs: 100,
      unit: 'unid',
    };
    onConstraintsChange([...constraints, newConstraint]);

    // Adiciona uma nova linha com zeros na matriz tecnológica
    const newRow = new Array(variables.length).fill(1.0);
    onMatrixChange([...technologyMatrix, newRow]);
  };

  const removeConstraint = (rowIdx: number) => {
    if (constraints.length <= 1) return;
    const newConstraints = constraints.filter((_, idx) => idx !== rowIdx);
    onConstraintsChange(newConstraints);

    const newMatrix = technologyMatrix.filter((_, idx) => idx !== rowIdx);
    onMatrixChange(newMatrix);
  };

  return (
    <div className="space-y-6">
      {/* Secção de Variáveis e Função Objetivo */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-foreground text-base">
              1. Cargas Candidatas & Margens de Contribuição (Variáveis $X_n$)
            </h3>
          </div>
          <button
            onClick={addVariable}
            className="flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Tipo de Carga</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/80 text-muted-foreground bg-muted/40 text-xs uppercase tracking-wider">
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Designação da Carga</th>
                <th className="py-2.5 px-3">Lucro Unitário ($c_j$) [€]</th>
                <th className="py-2.5 px-3">Unidade</th>
                <th className="py-2.5 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {variables.map((variable, idx) => (
                <tr key={variable.code} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {variable.code}
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={variable.name}
                      onChange={(e) => handleVariableNameChange(idx, e.target.value)}
                      className="w-full bg-background border border-input rounded px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-muted-foreground text-xs">€</span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={variable.profitCoefficient}
                        onChange={(e) => handleProfitChange(idx, parseFloat(e.target.value) || 0)}
                        className="w-full pl-6 pr-2 py-1 bg-background border border-input rounded text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground text-xs">
                    {variable.unit || 'unid'}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => removeVariable(idx)}
                      disabled={variables.length <= 1}
                      className="p-1 rounded text-red-500 hover:bg-red-500/10 disabled:opacity-30 transition-colors"
                      title="Remover carga"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Secção da Matriz de Consumo Tecnológico e Limites do Contentor */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-foreground text-base">
              2. Matriz Tecnológica ($a_{ij}$) e Limites Operacionais ($R_m \le b_i$)
            </h3>
          </div>
          <button
            onClick={addConstraint}
            className="flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Restrição</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/80 text-muted-foreground bg-muted/40 text-xs uppercase tracking-wider">
                <th className="py-2.5 px-3">Folga ($S_i$)</th>
                <th className="py-2.5 px-3">Restrição Operacional</th>
                {variables.map((v) => (
                  <th key={v.code} className="py-2.5 px-3 font-mono text-center">
                    {v.code} ({v.name.slice(0, 10)})
                  </th>
                ))}
                <th className="py-2.5 px-3 text-center">Sinal</th>
                <th className="py-2.5 px-3 text-right">Capacidade Máx ($b_i$)</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {constraints.map((constraint, rIdx) => (
                <tr key={constraint.slackCode} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {constraint.slackCode}
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={constraint.name}
                      onChange={(e) => handleConstraintNameChange(rIdx, e.target.value)}
                      className="w-full bg-background border border-input rounded px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                    />
                  </td>
                  {variables.map((_, cIdx) => (
                    <td key={cIdx} className="py-2.5 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={technologyMatrix[rIdx]?.[cIdx] ?? 0}
                        onChange={(e) =>
                          handleMatrixCellChange(rIdx, cIdx, parseFloat(e.target.value) || 0)
                        }
                        className="w-20 text-center bg-background border border-input rounded px-2 py-1 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm mx-auto"
                      />
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-muted-foreground">
                    &le;
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={constraint.capacityRhs}
                        onChange={(e) => handleCapacityChange(rIdx, parseFloat(e.target.value) || 0)}
                        className="w-24 text-right bg-background border border-input rounded px-2 py-1 text-foreground font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                      />
                      <span className="text-xs text-muted-foreground w-12 text-left pl-1">
                        {constraint.unit}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => removeConstraint(rIdx)}
                      disabled={constraints.length <= 1}
                      className="p-1 rounded text-red-500 hover:bg-red-500/10 disabled:opacity-30 transition-colors"
                      title="Remover restrição"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

