# Ficha de Especificação de Dados Logísticos — PDA Containers
> **Modelo de Coleta e Parametrização para Otimização Linear de Cargas (Simplex)**  
> *Preencha as tabelas abaixo com os dados da sua operação para calcular o melhor carregamento do container no OptiCargo.*

---

## 1. Identificação do Cenário e do Container

Preencha os dados básicos da viagem ou rota de transporte:

| Campo | Preenchimento | Exemplo / Referência |
| :--- | :--- | :--- |
| **Nome da Operação / Cenário** | `[Preencha aqui]` | *Ex: Rota Santos - Lote Peças & Eletrônicos* |
| **Tipo de Container** | `[20' Dry / 40' Dry / 40' HC]` | *Ex: 40' High Cube (Padrão)* |
| **Origem e Destino** | `[Origem & Destino]` | *Ex: Porto de Santos / Manaus* |
| **Moeda de Referência** | `[R$ / US$ / €]` | *Ex: R$ (Reais) ou US$* |

---

## 2. Limites Físicos e Capacidades do Container (Restrições: $b_i$)

Defina os limites máximos do container. O sistema garante que **nada vai estourar esses limites**:

| Código | Limite do Container | Capacidade Máxima ($b_i$) | Unidade | Para que serve esse limite? |
| :---: | :--- | :---: | :---: | :--- |
| **S1** | Peso Máximo de Carga (*Payload*) | `26.5` | Toneladas (t) | Limite de peso da balança rodoviária e da estrutura |
| **S2** | Volume Interno Útil (Espaço) | `76.0` | Metros Cúbicos ($m^3$) | O volume total de espaço disponível dentro do container |
| **S3** | Capacidade de Amarração (*Peação*) | `120.0` | Pontos de fixação | Limite de pontos e cintas para amarrar a carga firme |
| **S4** | *[Opcional: Limite de Valor/Seguro]* | `[Valor]` | `R$ / US$` | Teto máximo de valor segurado por container |
| **S5** | *[Opcional: Horas de Carregamento]* | `[Valor]` | Horas | Janela máxima de tempo para estufar o container |

---

## 3. Catálogo de Cargas Disponíveis (Variáveis de Decisão: $X_n$)

Indique cada tipo de carga que você tem no estoque/armazém e o **Lucro Unitário Líquido ($c_j$)** que cada unidade gera:

| Código | Nome da Carga | Lucro por Unidade ($c_j$) | Unidade de Medida | Descrição / Tipo de Embalagem |
| :---: | :--- | :---: | :---: | :--- |
| **X1** | Maquinário Pesado Industrial | `R$ 14.000` | unidades | Caixa reforçada em madeira |
| **X2** | Peças Automotivas em Paletes | `R$ 7.000` | paletes | Palete padrão PBR (1,20m x 1,00m) |
| **X3** | Eletrônicos e Componentes | `R$ 16.000` | lotes | Caixas lacradas de alto valor agregado |
| **X4** | Têxteis e Roupas Premium | `R$ 9.500` | fardos | Caixas de papelão reforçado |
| **X5** | `[Nova Carga]` | `[Valor]` | `[unidade]` | `[Descrição da carga]` |

---

## 4. Matriz de Consumo: O que cada carga gasta do container ($a_{ij}$)

Indique **quanto 1 unidade de cada carga gasta de peso, volume e amarração**:

| Limite do Container ($S_m$) | Unidade | Gasto da Carga X1 | Gasto da Carga X2 | Gasto da Carga X3 | Gasto da Carga X4 | Gasto da Carga X5 | Limite Máximo ($b_i$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **S1 - Peso** | Toneladas | `4.5` | `1.8` | `1.2` | `0.8` | `[ ]` | **&le; 26.5 t** |
| **S2 - Volume** | $m^3$ | `6.0` | `5.5` | `8.0` | `7.2` | `[ ]` | **&le; 76.0 $m^3$** |
| **S3 - Amarração** | Pontos | `20.0` | `10.0` | `12.0` | `8.0` | `[ ]` | **&le; 120 pts** |
| **S4 - [Extra]** | *[ ]* | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | **&le; [ ]** |

---

## 5. Como Colocar esses Dados no Sistema

Você tem 3 formas super simples:

1. **Direto na Tela do Navegador:**
   * Abra o painel: [pda_optimizer_dashboard.html](file:///C:/Users/vinicius.sirino/.gemini/antigravity/brain/da1c8e67-c2c4-4d43-a6e2-96230302960b/pda_optimizer_dashboard.html)
   * Altere os números nas tabelas e clique em **"Calcular Melhor Combinação"**.

2. **Copiar e Colar o Arquivo JSON:**
   * Abra o arquivo: [`modelo_dados_pda.json`](file:///C:/Users/vinicius.sirino/.gemini/antigravity/scratch/pda-containers-optimizer/data/modelo_dados_pda.json)
   * Altere os valores, clique em **"Importar / Exportar JSON"** no painel e cole lá.

3. **Pela Planilha do Excel:**
   * Abra o arquivo [`planilha_dados_cargas.csv`](file:///C:/Users/vinicius.sirino/.gemini/antigravity/scratch/pda-containers-optimizer/data/planilha_dados_cargas.csv) no Excel para editar em planilha.
