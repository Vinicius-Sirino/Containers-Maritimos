# 🚢 Documentação Acadêmica e Técnica — Sistema PDA Containers (Otimizador de Cargas v2.0)

> **Disciplina:** Pesquisa Operacional / Programação Linear  
> **Projeto:** Sistema Responsivo de Otimização Logística para Carregamento de Containers Marítimos (*40' High Cube*)  
> **Métodos Implementados:** **Método Gráfico (2D)** e **Método Simplex Tabular (Gauss-Jordan de 1 Fase)** — *Implementação 100% própria (sem bibliotecas externas de solver).*

---

## 1. Contextualização e Problema de Pesquisa Operacional

No setor de logística marítima e cabotagem, empresas operadoras de containers enfrentam diariamente o **Problema de Alocação Ótima de Cargas (Mix de Estivagem)**: decidir **quantas unidades de cada tipo de mercadoria** embarcar em um container de forma a **maximizar o lucro líquido total ($Z$)** sem ultrapassar os limites físicos e operacionais do equipamento e da operação portuária.

O sistema **PDA Containers v2.0** resolve esse problema aplicando rigorosamente a teoria da **Programação Linear (PL)** por meio de duas abordagens complementares e integradas em tempo real:
1. **Método Gráfico (Plano Cartesiano 2D):** Determina geometricamente os semiplanos das inequações, o polígono convexo da **Região Viável**, o **Vetor Gradiente ($\nabla Z$)**, as **Curvas de Nível (Reta de Iso-Lucro)** e os **Vértices (Pontos Extremos)**.
2. **Método Simplex Tabular (Algoritmo de Dantzig / Gauss-Jordan):** Resolve algebricamente modelos com $n$ variáveis de decisão e $m$ restrições, exibindo o **Tableau passo a passo** em cada iteração, identificando variável que entra na base, variável que sai da base (Teste da Razão Mínima $\theta$), elemento pivô, variáveis de folga ($S_i$) e preços-sombra (*shadow prices*).

---

## 2. Modelagem Matemática Completa

### 2.1. Variáveis de Decisão ($X_j$)
No cenário padrão do sistema (**Container 40' High Cube — 4 Cargas**), definimos quatro variáveis de decisão não-negativas ($X_j \ge 0$):

| Código | Mercadoria / Tipo de Carga | Unidade | Lucro Unitário ($c_j$) |
| :---: | :--- | :---: | :---: |
| $X_1$ | **Maquinário Pesado** | `unid` | R$ 3.000,00 |
| $X_2$ | **Peças Automotivas** | `paletes` | R$ 2.700,00 |
| $X_3$ | **Eletrônicos & Chips** | `lotes` | R$ 3.700,00 |
| $X_4$ | **Têxteis e Roupas** | `fardos` | R$ 2.750,00 |

### 2.2. Função Objetivo (Maximização do Lucro Total $Z$)
$$\max Z = \sum_{j=1}^{n} c_j X_j = 3000 X_1 + 2700 X_2 + 3700 X_3 + 2750 X_4$$

### 2.3. Restrições Operacionais do Container ($a_{ij} X_j \le b_i$)
O carregamento está sujeito a quatro limites físicos e operacionais ($m = 4$):

| Folga ($S_i$) | Recurso / Limite do Container | Inequação Linear ($\sum a_{ij} X_j \le b_i$) | Capacidade Máxima ($b_i$) |
| :---: | :--- | :--- | :---: |
| $S_1$ | **Peso Máximo (Payload)** | $6 X_1 + 2 X_2 + 2 X_3 + 2 X_4 \le 48$ | $48\text{ toneladas}$ |
| $S_2$ | **Volume do Container (Espaço)** | $5 X_1 + 2 X_2 + 5 X_3 + 1 X_4 \le 55$ | $55\text{ m}^3$ |
| $S_3$ | **Pontos de Amarração (Peação)** | $2 X_1 + 4 X_2 + 6 X_3 + 1 X_4 \le 54$ | $54\text{ pontos}$ |
| $S_4$ | **Horas de Estiva (Equipe)** | $1 X_1 + 2 X_2 + 2 X_3 + 6 X_4 \le 44$ | $44\text{ horas}$ |

Condição de não-negatividade:
$$X_1, X_2, X_3, X_4 \ge 0$$

### 2.4. Conversão para a Forma Padrão (Introdução das Variáveis de Folga $S_i$)
Para aplicar o Método Simplex Tabular, convertemos as inequações ($\le$) em equações lineares introduzindo as **variáveis de folga** $S_1, S_2, S_3, S_4 \ge 0$ (que representam a capacidade ociosa de cada recurso) e reescrevemos a função objetivo igualada a zero:

$$\begin{aligned}
Z - 3000 X_1 - 2700 X_2 - 3700 X_3 - 2750 X_4 &= 0 \\
6 X_1 + 2 X_2 + 2 X_3 + 2 X_4 + S_1 &= 48 \\
5 X_1 + 2 X_2 + 5 X_3 + 1 X_4 + S_2 &= 55 \\
2 X_1 + 4 X_2 + 6 X_3 + 1 X_4 + S_3 &= 54 \\
1 X_1 + 2 X_2 + 2 X_3 + 6 X_4 + S_4 &= 44
\end{aligned}$$

---

## 3. Como Funciona o Método Gráfico (2D) no Sistema

A seção **3. Método Gráfico de Programação Linear** resolve e desenha o problema no plano cartesiano bidimensional:

1. **Cálculo Analítico de Todas as Interseções (Regra de Cramer $2 \times 2$):**
   Para cada par de retas $A_1 X + B_1 Y = C_1$ e $A_2 X + B_2 Y = C_2$ (incluindo os eixos $X = 0$ e $Y = 0$), o motor calcula o determinante $\Delta = A_1 B_2 - A_2 B_1$. Quando $|\Delta| > 10^{-9}$, obtém-se o ponto de interseção candidato:
   $$X = \frac{C_1 B_2 - C_2 B_1}{\Delta}, \qquad Y = \frac{A_1 C_2 - A_2 C_1}{\Delta}$$

2. **Filtragem de Viabilidade e Ordenação Polar do Polígono Convexo:**
   - Todo ponto candidato $(X, Y)$ é testado contra todas as restrições $a_{ix} X + a_{iy} Y \le b_i$ e $X, Y \ge 0$.
   - Os pontos aprovados constituem os **Vértices (Pontos Extremos)** da Região Viável.
   - Os vértices são ordenados em sentido anti-horário pelo ângulo polar em relação ao centroide para desenhar o polígono sombreado.

3. **Avaliação pelo Teorema Fundamental da Programação Linear:**
   No cenário 2D (ou projeção $X_1 \times X_3$), o sistema encontra e exibe na tabela lateral todos os **5 vértices extremos**:
   - **$V_0 = (0,00;\ 0,00)$** $\rightarrow Z = \text{R\$ } 0,00$ (Origem — container vazio)
   - **$V_1 = (8,00;\ 0,00)$** $\rightarrow Z = \text{R\$ } 24.000,00$ (Limitado pelo Peso $S_1$)
   - **$V_2 = (6,50;\ 4,50)$** $\rightarrow Z = \text{R\$ } 36.150,00$ (Interseção entre Peso $S_1$ e Volume $S_2$)
   - **$V_3^\star = (3,00;\ 8,00)$** $\rightarrow \mathbf{Z^* = \text{R\$ } 38.600,00}$ (**Vértice Ótimo 2D** — Interseção entre Volume $S_2$ e Amarração $S_3$)
   - **$V_4 = (0,00;\ 9,00)$** $\rightarrow Z = \text{R\$ } 33.300,00$ (Limitado pela Amarração $S_3$)

4. **Vetor Gradiente ($\nabla Z$) e Animação da Reta de Iso-Lucro ($Z$):**
   - O sistema desenha o vetor gradiente $\nabla Z = [c_x, c_y]$ partindo da origem, apontando a direção de maior crescimento do lucro.
   - Com o controle deslizante ou o botão **▶ Animar Reta Z**, é possível observar a reta tracejada $c_x X + c_y Y = Z$ se deslocando paralelamente até tocar o último ponto da região viável ($V_3^\star$).

---

## 4. Como Funciona o Motor Simplex Tabular Passo a Passo

O algoritmo Simplex executa iterativamente os três passos clássicos de Dantzig:

1. **Teste de Otimalidade e Escolha da Variável que Entra (Regra de Dantzig):**
   - Inspeciona a Linha 0 (linha de $Z$). Enquanto houver coeficientes negativos ($Z_j - c_j < -\epsilon$), a solução ainda pode ser melhorada.
   - Seleciona-se a **Coluna Pivô $k$** com o valor **mais negativo** (maior contribuição marginal ao lucro).

2. **Escolha da Variável que Sai (Teste da Razão Mínima $\theta$):**
   - Para todas as linhas de restrição $i \in \{1, \dots, m\}$ com coeficiente estritamente positivo na coluna pivô ($a_{ik} > 0$), calcula-se $\theta_i = \text{RHS}_i / a_{ik}$.
   - A **Linha Pivô $r$** é aquela que apresenta o **menor $\theta_i$**, garantindo que a nova solução básica continue viável ($\text{RHS} \ge 0$). Caso nenhum $a_{ik} > 0$ exista, o algoritmo detecta **Solução Ilimitada (*Unbounded*)**.

3. **Pivoteamento de Gauss-Jordan:**
   - Divide-se toda a linha pivô $L_r$ pelo **Elemento Pivô** $P = a_{rk}$: $L_r \leftarrow L_r / P$.
   - Zera-se a coluna pivô nas demais linhas ($i \ne r$) por escalonamento: $L_i \leftarrow L_i - a_{ik} \cdot L_r$.

### Trajetória das Iterações no Exemplo Padrão (4 Cargas):
- **Início (Base 0):** Base inicial formada pelas folgas $\{S_1, S_2, S_3, S_4\}$, container vazio ($Z = \text{R\$ } 0,00$).
- **Rodada 1:** Entra **`X3` (Eletrônicos)** (maior lucro unitário: R$ 3.700) $\rightarrow$ Sai **`S3` (Amarração)** ($\theta = 54/6 = 9,00$).
- **Rodada 2:** Entra **`X1` (Maquinário)** $\rightarrow$ Sai **`S1` (Peso)**.
- **Rodada 3:** Entra **`X4` (Têxteis)** $\rightarrow$ Sai **`S4` (Horas de Estiva)**.
- **Rodada 4:** Entra **`X2` (Peças Automotivas)** $\rightarrow$ Sai **`S2` (Volume)**.
- **Solução Final Ótima:** Todos os coeficientes na linha de $Z$ tornam-se $\ge 0$, encerrando o algoritmo com:
  $$\mathbf{X_1^* = 4\text{ unid}, \quad X_2^* = 3\text{ paletes}, \quad X_3^* = 5\text{ lotes}, \quad X_4^* = 4\text{ fardos}} \implies \mathbf{Z^* = \text{R\$ } 49.600,00}$$

### Interpretação Econômica na Tabela Final (Preços-Sombra / *Shadow Prices*):
Na linha `Z` da tabela ótima final, os valores nas colunas das variáveis de folga ($S_1, S_2, S_3, S_4$) fornecem os **Preços-Sombra (Variáveis Duais $y_i^*$)** de cada recurso do container:
- **$S_1 = \text{R\$ } 250,00/\text{tonelada}$** (cada tonelada extra de capacidade de peso aumentaria o lucro máximo em R$ 250,00).
- **$S_2 = \text{R\$ } 100,00/\text{m}^3$** (cada $\text{m}^3$ adicional de volume aumentaria o lucro em R$ 100,00).
- **$S_3 = \text{R\$ } 350,00/\text{ponto}$** (cada ponto extra de amarração aumentaria o lucro em R$ 350,00).
- **$S_4 = \text{R\$ } 300,00/\text{hora}$** (cada hora adicional de equipe aumentaria o lucro em R$ 300,00).

---

## 5. Roteiro Sugerido para Apresentação ao Professor

1. **Apresentação do Problema (Tabela 1 e Tabela 2):** Mostre que o sistema resolve o carregamento ótimo de um container com $n$ cargas candidatas e $m$ limites físicos (peso, volume, amarração, horas de estiva), permitindo adicionar ou remover variáveis e restrições dinamicamente.
2. **Demonstração do Método Gráfico 2D (Botão `📐 Exemplo 2 Cargas (2D)`):** Clique no botão de 2 cargas, mostre o polígono azul da **Região Viável** e os **5 vértices** ($V_0$ a $V_4$). Clique em **▶ Animar Reta Z** para mostrar a reta objetivo se deslocando na direção do **Vetor Gradiente ($\nabla Z$)** até atingir o vértice ótimo $V_3^\star = (3,00;\ 8,00)$.
3. **Demonstração Multidimensional (Botão `✨ Exemplo 4 Cargas (40' HC)`):** Clique no exemplo de 4 cargas e mostre que todas as 4 mercadorias entram no container ($X_1=4, X_2=3, X_3=5, X_4=4$) gerando o lucro máximo $Z^* = \text{R\$ } 49.600,00$ com 100% de aproveitamento dos 4 recursos.
4. **Inspeção do Algoritmo Simplex (Seção 4):** Clique nos botões `Início (Base 0)` $\rightarrow$ `Rodada 1` $\rightarrow$ `Rodada 2` $\rightarrow$ `Rodada 3` $\rightarrow$ `Solução Final` para mostrar a Coluna Pivô (azul), a Linha Pivô com a Razão Mínima $\theta$ (amarelo) e a Célula Pivô do escalonamento de Gauss-Jordan.

