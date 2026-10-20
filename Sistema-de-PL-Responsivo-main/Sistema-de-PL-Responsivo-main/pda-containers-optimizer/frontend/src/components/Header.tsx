import React from 'react';
import { Box, Moon, Sun, RefreshCw, Sparkles, Sliders } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLoadPreset: () => void;
  onSolve: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onLoadPreset,
  onSolve,
  isLoading,
}) => {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600/10 dark:bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400">
            <Box className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-foreground">PDA Containers</span>
              <span className="text-xs uppercase px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                OptiCargo Simplex v2.0
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Motor de Otimização Linear e Alocação de Espaço em Contentores Intermodais
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onLoadPreset}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md border border-input bg-background hover:bg-accent text-foreground transition-all shadow-sm"
            title="Preencher com os dados do contentor padrão de 40 pés"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="hidden md:inline">Cenário Real PDA (40' HC)</span>
            <span className="md:hidden">40' HC</span>
          </button>

          <button
            onClick={onSolve}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-all shadow shadow-blue-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'A calcular...' : 'Executar Simplex'}</span>
          </button>

          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-md border border-input bg-background hover:bg-accent text-foreground transition-colors"
            title={darkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};

