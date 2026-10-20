import { OptimizationRequest, OptimizationResult } from '../types/optimizer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/optimizer';

export async function solveSimplex(request: OptimizationRequest): Promise<OptimizationResult> {
  const response = await fetch(`${API_BASE_URL}/solve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Falha na comunicação com o motor Simplex.' }));
    throw new Error(errorBody.error || `Erro HTTP ${response.status}`);
  }

  return response.json();
}

export async function fetch40FtPreset(): Promise<OptimizationRequest> {
  const response = await fetch(`${API_BASE_URL}/preset/40ft-container`);
  if (!response.ok) {
    throw new Error('Não foi possível carregar o cenário preset da API.');
  }
  return response.json();
}

