# PDA Containers - OptiCargo Simplex v2.0
> **Sistema Corporativo de Otimização Logística e Alocação de Cargas em Contentores**  
> Inspirado em soluções de ponta da indústria como *Zebra Workcloud*, *Optware* e *Stockimizer*.

---

## 1. Visão Geral e Arquitetura

O **PDA Containers OptiCargo** é uma solução de nível empresarial desenvolvida para resolver o problema de alocação ótima de cargas em contentores marítimos e intermodais (e.g. 40ft High Cube / Dry Box). 

O sistema maximiza a **Margem de Contribuição Total ($Z$)** sujeita a restrições operacionais críticas:
- **Capacidade de Peso (Payload Limit)** em toneladas;
- **Volume Cúbico Útil** em $m^3$;
- **Limites de Peação / Fixação Estrutural (Lashing points)**;
- Restrições orçamentais ou aduaneiras adicionais configuráveis dinamicamente.

```
┌────────────────────────────────────────────────────────┐
│                   Arquitetura Limpa                    │
│                                                        │
│  [ PdaContainers.Api ]  (ASP.NET Core 8 Web API)       │
│           │                                            │
│           ▼                                            │
│  [ PdaContainers.Application ]                         │
│           ├── SimplexSolverService (Simplex de 1 Fase) │
│           ├── DTOs & Mapeamentos                       │
│           ▼                                            │
│  [ PdaContainers.Domain ] (Entidades e Enums Puros)    │
└────────────────────────────────────────────────────────┘
```

---

## 2. Núcleo Matemático (Simplex Tabular Puro)

O motor foi construído em C# puro, **sem qualquer dependência externa** (sem OR-Tools, CPLEX ou Gurobi):

1. **Formulação Canônica**:
   $$\max Z = \sum_{j=1}^{n} c_j X_j$$
   $$\text{sujeito a } \sum_{j=1}^{n} a_{ij} X_j \le b_i, \quad \forall i \in \{1,\dots,m\}, \quad X_j \ge 0, \ b_i \ge 0$$

2. **Forma Padrão com Variáveis de Folga**:
   $$\sum_{j=1}^{n} a_{ij} X_j + S_i = b_i, \quad i = 1,\dots,m$$
   Linha da Função Objetivo: $Z - \sum_{j=1}^n c_j X_j = 0$.

3. **Critério de Otimalidade e Regra de Dantzig**:
   - Coluna entrante $k = \arg\min_j (Z_j - c_j)$ para $Z_j - c_j < -\epsilon$.
   - Critério de paragem: $\forall j, \text{coef}_j \ge -\epsilon$ (nenhum ganho marginal disponível).

4. **Teste da Razão Mínima**:
   $$\theta_i = \frac{b_i}{a_{ik}}, \quad \text{para } a_{ik} > \epsilon$$
   Linha sainte $r = \arg\min_i \theta_i$. Se $\forall i, a_{ik} \le \epsilon$, o algoritmo acusa **Solução Ilimitada (Unbounded)**.

5. **Pivoteamento de Gauss-Jordan**:
   - $L_r \leftarrow L_r / P$ (onde $P = a_{rk}$ é o elemento pivô);
   - $L_i \leftarrow L_i - a_{ik} L_r, \quad \forall i \ne r$.

6. **Deteção de Múltiplas Soluções Ótimas**:
   - Na solução ótima, se alguma variável não-básica possui custo reduzido igual a zero ($|Z_j - c_j| < \epsilon$), o sistema reporta soluções ótimas alternativas.

---

## 3. Como Executar a Aplicação

### Backend (.NET 8 Web API)
```bash
cd backend/src/PdaContainers.Api
dotnet run
# Aceder ao Swagger UI em: https://localhost:5001/swagger ou http://localhost:5000/swagger
```

### Executar Testes Unitários
```bash
cd backend/tests/PdaContainers.Tests
dotnet test
```

### Frontend (React + Vite + Tailwind CSS)
```bash
cd frontend
npm install
npm run dev
# Abrir no navegador: http://localhost:3000
```

