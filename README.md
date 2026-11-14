# Otimização de Rota de Entregas por Colônia de Formigas (Ant System)

- **Repositório:** https://github.com/YuriGit909/aco-delivery-route
- **Página da Aplicação:** https://acodeliveryroute.netlify.app
- **Página de Testes:** https://acodeliveryroute.netlify.app/tests

## Autores

- Bianca da Silva Magalhães Pinheiro (20249012612)
- Francisco Eudes Andrade Nazário (20249021344)
- Yuri da Silva Barbosa (20249021792)

## Descrição da solução

O simulador resolve o problema de rota de entregas como um caixeiro-viajante: o veículo sai do depósito, visita cada ponto de entrega exatamente uma vez e retorna ao depósito, minimizando a distância total. Os locais formam um grafo completo, não direcionado, com coordenadas no plano e distâncias euclidianas d(i, j) = √((x(i) − x(j))² + (y(i) − y(j))²).

O algoritmo implementado é o **Ant System**:

1. Todas as arestas começam com o mesmo feromônio τ₀.
2. Em cada iteração, cada formiga constrói uma rota completa a partir do depósito. A cada passo, calcula o peso de cada vértice ainda não visitado, w(i,j) = τ(i,j)^α × (1/d(i,j))^β, converte os pesos em probabilidades p(i,j) = w(i,j) / Σ w(i,u) e sorteia o próximo vértice por roleta (não escolhe o de maior peso). Depois de visitar todos os vértices, a formiga retorna obrigatoriamente ao depósito.
3. Todas as formigas da iteração usam a mesma matriz de feromônio, obtida ao final da iteração anterior. Somente depois que todas terminam, o feromônio é atualizado: τ_novo(i,j) = (1 − ρ) × τ_antigo(i,j) + Σ Δτₖ(i,j), em que cada formiga deposita Q/Lₖ em cada aresta percorrida, inclusive na aresta de retorno ao depósito.
4. A matriz é mantida simétrica (τ(i,j) = τ(j,i)), cada formiga contribui uma única vez por aresta, a diagonal não recebe feromônio e, após a atualização, cada aresta tem no mínimo 10⁻¹² de feromônio (proteção numérica).
5. São registradas a melhor rota de cada iteração e a melhor rota de toda a execução, que é apresentada ao final do número configurado de iterações.

### Organização do código

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Página da aplicação |
| `tests.html` | Página dos testes de validação |
| `css/style.css` | Layout, configuração, botões e avisos |
| `css/graph.css` | Estilo e responsividade do grafo |
| `css/panels.css` | Estilo e responsividade de métricas, histórico e logs |
| `js/rng.js` | Gerador pseudoaleatório com semente |
| `js/aco.js` | Núcleo do algoritmo: distâncias, probabilidades, roleta, construção de rotas e atualização do feromônio |
| `js/simulacao.js` | Estado da execução: uma iteração completa por chamada, histórico e melhor rota |
| `js/controlador.js` | Executar, Pausar, Avançar uma iteração e Reiniciar |
| `js/validacao.js` | Validação dos campos |
| `js/grafo.js` | Visualização do grafo em SVG |
| `js/paineis.js` | Métricas, histórico e logs |
| `js/main.js` | Integração da interface |
| `js/tests.js` | Testes de validação |

### Decisões de projeto

- **Separação entre algoritmo e interface.** As funções do núcleo (`aco.js`) e a simulação (`simulacao.js`) não acessam a página. Isso permite testá-las diretamente, fornecendo rotas e escolhas às funções.
- **Reprodutibilidade.** Todos os sorteios usam um único gerador com semente, consumido apenas pelo algoritmo. A simulação executa cada iteração de forma completa e síncrona; o controlador apenas decide quando chamar a próxima. Por isso, pausar, avançar ou alterar a velocidade visual não altera os sorteios nem os resultados. Reiniciar recria o gerador com a semente, restaura τ₀ e limpa o histórico.
- **Escala visual do feromônio.** A espessura e a opacidade de cada aresta são proporcionais ao maior feromônio já observado na execução (incluindo τ₀). Essa referência nunca diminui, então uma aresta que perdeu feromônio nunca aparece mais grossa. Quando a referência aumenta, a interface exibe um aviso com os valores anterior e novo.
- **Logs de construção.** O passo a passo completo (vértice atual, candidatos, τ, d, w, probabilidade, faixa da roleta, número sorteado e vértice escolhido) é guardado para a melhor formiga de cada iteração. A rota, o comprimento e o depósito Q/L de todas as formigas também são registrados.
- **Precisão.** Os cálculos internos usam precisão total; o arredondamento ocorre apenas na exibição.
- **Validação.** Números devem usar ponto como separador decimal. Identificadores diferenciam maiúsculas de minúsculas. A semente aceita qualquer inteiro representável com exatidão em JavaScript.

## Instruções de uso

1. Acesse a aplicação publicada. Ela abre com um cenário de 8 vértices, com o depósito em A.
2. Edite, adicione ou remova vértices (entre 4 e 12) e escolha o depósito.
3. Ajuste os parâmetros e clique em **Reiniciar** para aplicar a configuração.
4. Use **Executar** para rodar até o fim, **Pausar** para interromper preservando o estado e **Avançar uma iteração** para executar uma única iteração e permanecer pausado. O controle de velocidade altera apenas o ritmo visual.
5. Passe o cursor sobre uma aresta para ver a distância e o feromônio, ou clique nela para ver também a atualização da última iteração (anterior, após evaporação, depósito e final).
6. Acompanhe as métricas, o gráfico e a tabela do histórico. Nos painéis de logs, escolha a iteração para ver a construção passo a passo de uma rota, as rotas de todas as formigas e a atualização do feromônio por aresta.

Qualquer alteração nos dados ou parâmetros pausa a execução e exige um novo Reiniciar. Campos vazios ou inválidos impedem a execução e geram mensagens indicando o campo e o problema. O botão **Carregar instância de teste** preenche a instância com um grafo menor para testes rápidos.

Para executar localmente, sirva a pasta com um servidor estático (por exemplo, a extensão Live Server do VS Code ou `python -m http.server`).

## Parâmetros

| Parâmetro | Faixa | Valor inicial | Significado |
|---|---|---|---|
| Vértices | 4 a 12, identificador único | cenário de 8 vértices | Locais da rota, incluindo o depósito |
| Coordenadas x, y | 0 a 1.000, até 2 casas decimais | — | Posição de cada vértice; coordenadas repetidas não são permitidas |
| Depósito | um dos vértices cadastrados | A | Início e fim da rota |
| Número de formigas | inteiro, 1 a 100 | 10 | Rotas construídas por iteração |
| Número de iterações | inteiro, 1 a 200 | 30 | Duração da execução |
| Influência do feromônio (α) | 0 a 5 | 1 | Com 0, o feromônio não influencia a escolha |
| Influência da distância (β) | 0 a 5 | 2 | Com 0, a distância não influencia a escolha |
| Taxa de evaporação (ρ) | 0% a 90% | 50% | Convertida em fração na fórmula (50% → 0,5) |
| Feromônio inicial (τ₀) | 0,01 a 100 | 1 | Aplicado igualmente a todas as arestas no início |
| Constante de depósito (Q) | 0,01 a 10.000 | 100 | Cada formiga deposita Q/L |
| Semente aleatória | inteiro | 42 | Reproduz os sorteios com os mesmos dados e parâmetros |

## Tecnologias e bibliotecas auxiliares

A aplicação usa apenas HTML, CSS e JavaScript, executados no navegador, sem servidor de aplicação. O Ant System foi implementado integralmente pelo grupo, sem bibliotecas de IA ou otimização. O grafo, o gráfico do histórico e os painéis foram feitos com SVG e JavaScript puros. Não foi utilizada nenhuma biblioteca auxiliar. O gerador pseudoaleatório com semente (mulberry32) foi implementado pelo grupo em `js/rng.js`.

A fonte Atkinson Hyperlegible é carregada do Google Fonts apenas para a apresentação visual.

## Resultados dos testes

Todos os testes automáticos estão em `tests.html` e podem ser executados no navegador. Os resultados decimais são comparados com tolerância absoluta de 0,000001. Todos os testes passaram.

### Instância de referência e cálculo das rotas

**Entradas:** A = (0,0), B = (3,0), C = (3,4), D = (0,4), depósito A.

**Saídas obtidas:** A-B = 3, A-C = 5, A-D = 4, B-C = 4, B-D = 5, C-D = 3, matriz simétrica e diagonal igual a zero. Comprimentos das seis rotas:

| Rota | Comprimento |
|---|---|
| A → B → C → D → A | 14 |
| A → B → D → C → A | 16 |
| A → C → B → D → A | 18 |
| A → C → D → B → A | 16 |
| A → D → B → C → A | 18 |
| A → D → C → B → A | 14 |

Em 1.000 rotas construídas pelo algoritmo (τ = 1, α = 1, β = 2), todas começaram e terminaram em A, visitaram os demais vértices sem repetição e tiveram comprimento 14, 16 ou 18.

**Conclusão:** o cálculo das distâncias e dos comprimentos e a construção das rotas estão corretos.

### Probabilidades de escolha

**Entradas:** formiga em A, nenhum outro vértice visitado, τ = 1 em todas as arestas, α = 1, β = 2.

**Saídas obtidas:**

| Cálculo | Valor obtido | Valor esperado |
|---|---|---|
| w(A,B) | 1/9 | 1/9 |
| w(A,C) | 1/25 | 1/25 |
| w(A,D) | 1/16 | 1/16 |
| p(A,B) | ≈ 0,520156 | 400/769 |
| p(A,C) | ≈ 0,187256 | 144/769 |
| p(A,D) | ≈ 0,292588 | 225/769 |
| Soma | 1 | 1 |
| p(B,C), após visitar B | ≈ 0,609756 | 25/41 |
| p(B,D), após visitar B | ≈ 0,390244 | 16/41 |

Nenhum candidato foi excluído por não ter o maior peso. Após a visita a B, apenas C e D participaram do sorteio. Com α = 0 e β = 0 (e feromônio diferente na aresta AB), os três candidatos receberam probabilidade 1/3. Com um único candidato restante, a probabilidade foi 1.

Na roleta com número sorteado forçado, r = 0,1 escolheu B, r = 0,6 escolheu C, r = 0,9 escolheu D e r = 0,9999999999 escolheu D. Em 10.000 sorteios a partir de A, as frequências de B, C e D ficaram a menos de 0,02 das probabilidades calculadas.

**Conclusão:** as probabilidades seguem a fórmula do Ant System, consideram apenas vértices não visitados, e o sorteio é proporcional às probabilidades, sem escolher sempre o maior peso.

### Evaporação e depósito

**Entradas:** τ₀ = 1, ρ = 50%, Q = 14, uma formiga com a rota forçada A → B → C → D → A (L = 14).

**Saídas obtidas:**

| Situação | Perímetro (AB, BC, CD, AD) | Diagonais (AC, BD) |
|---|---|---|
| Após a evaporação, 1ª iteração | 0,5 | 0,5 |
| Final da 1ª iteração | 1,5 | 0,5 |
| Final da 2ª iteração (mesma rota) | 1,75 | 0,25 |
| Duas formigas na mesma rota, uma iteração | 2,5 | 0,5 |

Logs da 1ª iteração, idênticos ao esperado:

- AB: "anterior 1; após evaporação 0,5; depósito 1; final 1,5"
- AC: "anterior 1; após evaporação 0,5; depósito 0; final 0,5"

A matriz permaneceu simétrica, sem feromônio na diagonal, e a matriz anterior não foi alterada pela atualização. Com uma matriz de 10⁻¹² e nenhuma formiga, a evaporação levaria os valores abaixo do piso, que foi aplicado em todas as arestas.

**Conclusão:** evaporação, depósito Q/L (inclusive na aresta de retorno D → A), soma das contribuições de várias formigas e simetria estão corretos, sem atualização durante a construção das rotas.

### Execução completa e reprodutibilidade

**Entradas:** instância de teste da aplicação, depósito A, 10 formigas, 30 iterações, α = 1, β = 2, ρ = 50%, τ₀ = 1, Q = 14, semente 42.

**Saídas obtidas:** melhor rota A → B → C → D → A, comprimento 14, encontrada na iteração 1. Foram gerados 30 registros, um por iteração. No estado inicial (iteração 0), τ = 1 em todas as arestas e a melhor distância é exibida como "ainda não calculada".

| Iteração | Menor da iteração | Média | Melhor acumulada |
|---|---|---|---|
| 1 | 14 | 15 | 14 |
| 2 | 14 | 15 | 14 |
| 3 | 14 | 14,4 | 14 |
| 4 | 14 | 14,6 | 14 |
| 5 | 14 | 14,2 | 14 |
| 6 | 14 | 14 | 14 |
| 7 | 14 | 14 | 14 |
| 8 | 14 | 14 | 14 |
| 9 | 14 | 14 | 14 |
| 10 | 14 | 14 | 14 |
| 11 | 14 | 14 | 14 |
| 12 | 14 | 14 | 14 |
| 13 | 14 | 14 | 14 |
| 14 | 14 | 14 | 14 |
| 15 | 14 | 14 | 14 |
| 16 | 14 | 14 | 14 |
| 17 | 14 | 14 | 14 |
| 18 | 14 | 14 | 14 |
| 19 | 14 | 14 | 14 |
| 20 | 14 | 14 | 14 |
| 21 | 14 | 14 | 14 |
| 22 | 14 | 14 | 14 |
| 23 | 14 | 14 | 14 |
| 24 | 14 | 14 | 14 |
| 25 | 14 | 14 | 14 |
| 26 | 14 | 14 | 14 |
| 27 | 14 | 14 | 14 |
| 28 | 14 | 14 | 14 |
| 29 | 14 | 14 | 14 |
| 30 | 14 | 14 | 14 |

Testes de reprodutibilidade, todos com histórico idêntico ao da execução de referência:

- Repetir a execução com os mesmos dados, parâmetros e semente;
- Reiniciar e executar novamente;
- Pausar na iteração 10 e retomar;
- Pausar na iteração 10 e retomar com outra velocidade;
- Executar com atraso visual de 0 ms e de 20 ms;
- Usar Avançar cinco vezes e depois Executar.

Com a semente 43, o histórico foi diferente. A melhor distância acumulada nunca aumentou e todas as rotas tiveram comprimento 14, 16 ou 18.

**Conclusão:** a rota ótima (comprimento 14) foi encontrada na iteração 1. A média das distâncias caiu de 15 para 14 até a iteração 6, quando todas as formigas passaram a construir a rota ótima, o que mostra a convergência da colônia pelo reforço de feromônio no perímetro. A execução é reprodutível, e pausar, avançar ou alterar a velocidade visual não altera o resultado.

### Efeito dos parâmetros e entradas inválidas

#### Comparação entre β = 0 e β = 2

**Entradas:** demais parâmetros da seção 6.4, cinco execuções por configuração, sementes 1 a 5.

| β | Semente | Melhor distância final | Iteração em que foi encontrada | Média das formigas na última iteração | Melhor rota |
|---|---|---|---|---|---|
| 0 | 1 | 14 | 1 | 16,8 | A → D → C → B → A |
| 0 | 2 | 14 | 1 | 15,4 | A → B → C → D → A |
| 0 | 3 | 14 | 1 | 15,4 | A → D → C → B → A |
| 0 | 4 | 14 | 1 | 16,4 | A → B → C → D → A |
| 0 | 5 | 14 | 1 | 15 | A → D → C → B → A |
| 2 | 1 | 14 | 1 | 14 | A → D → C → B → A |
| 2 | 2 | 14 | 1 | 14 | A → D → C → B → A |
| 2 | 3 | 14 | 1 | 14 | A → B → C → D → A |
| 2 | 4 | 14 | 1 | 14 | A → D → C → B → A |
| 2 | 5 | 14 | 1 | 14 | A → D → C → B → A |

| β | Média da melhor distância final | Execuções que atingiram 14 |
|---|---|---|
| 0 | 14 | 5 de 5 |
| 2 | 14 | 5 de 5 |

**Conclusão:** pelo critério pedido, não houve diferença entre β = 0 e β = 2: ambas as configurações atingiram o ótimo 14 nas cinco sementes, sempre na iteração 1. Isso é esperado nesta instância pequena. Com β = 0, a primeira iteração equivale a um sorteio uniforme entre 6 rotas, das quais 2 são ótimas, e a probabilidade de nenhuma das 10 formigas encontrar o ótimo é (2/3)¹⁰ ≈ 1,7%. Com β = 2, a probabilidade de cada formiga encontrá-lo na primeira iteração sobe de 1/3 para cerca de 53%: (400/769) × (25/41) + (225/769) × (25/34) ≈ 0,532.

A diferença aparece na convergência da colônia. Com β = 2, a média das formigas na última iteração foi 14 em todas as execuções; com β = 0, ficou entre 15 e 16,8, ou seja, várias formigas ainda construíam rotas subótimas na iteração 30. Sem a influência da distância, a escolha depende apenas do feromônio, e os depósitos diferenciam pouco as rotas (Q/L = 1; 0,875; ≈ 0,778 para L = 14, 16 e 18). Com β = 2, as arestas curtas do perímetro são favorecidas diretamente na escolha. Como foram apenas cinco sementes por configuração, o resultado ilustra a tendência, mas não tem valor estatístico conclusivo.

#### Entradas inválidas

Testes automáticos: a função de validação aceitou a entrada válida de referência (convertendo ρ = 50% em 0,5 e o depósito A no índice 0) e aceitou ρ = 0%. Rejeitou, com mensagem: coordenadas duplicadas (inclusive escritas de formas diferentes, como "3" e "3.00"), identificador repetido, menos de quatro vértices, identificador vazio, coordenada vazia, coordenada acima de 1.000, coordenada negativa, coordenada com 3 casas decimais, coordenada não numérica, depósito inexistente, formigas vazio, formigas <= 0 e > 100, formigas com valores não inteiros, iterações > 200, α > 5, β negativo, ρ > 90%, τ₀ = 0, Q > 10.000, semente não inteira e semente vazia.

Testes manuais na interface (alteração seguida de Reiniciar):

| Caso | Como foi reproduzido | Mensagem exibida | Execução bloqueada? |
|---|---|---|---|
| Coordenadas duplicadas | B alterado para (0; 0), igual a A | Coordenadas (0; 0) repetidas nos vértices 1 e 2: isso produziria distância zero. | Sim |
| Identificador repetido | ID de B alterado para "A" | Identificador "A" repetido (vértices 1 e 2). | Sim |
| Campo vazio | "Número de formigas" apagado | Número de formigas: campo obrigatório. | Sim |
| Fora do intervalo | Formigas = 101 | Número de formigas: deve estar entre 1 e 100. | Sim |
| Fora do intervalo | ρ = 95 | Taxa de evaporação (ρ, %): deve estar entre 0 e 90. | Sim |
| Fora do intervalo | τ₀ = 0 | Feromônio inicial (τ₀): deve estar entre 0,01 e 100. | Sim |
| Menos de quatro vértices | Tentativa de remover um vértice com 4 cadastrados | Botão Remover desabilitado; a validação também rejeita listas com menos de 4 vértices (teste automático) | Sim |

Em todos os casos, os botões Executar e Avançar ficaram desabilitados até a correção e um novo Reiniciar.

#### Evaporação nula

Com ρ = 0%, nenhuma aresta teve o feromônio reduzido pela evaporação: o valor após a evaporação foi igual ao anterior, e as diagonais, que não receberam depósito, permaneceram em 1. Somente os depósitos alteraram o feromônio.

**Conclusão:** entradas inválidas impedem a execução e geram mensagens que indicam o campo e o problema; com ρ = 0%, apenas os depósitos e a proteção numérica podem alterar o feromônio.