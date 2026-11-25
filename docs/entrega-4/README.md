# Entrega 4 — Evolução da integração contínua

Aluno: Ricardo Minuto. Data: 17/11/2026. Trabalho individual.

## Problema e mudança

Os workflows originais verificavam pushes somente na main. Os workflows CI e Lint agora executam em pushes de qualquer branch e em pull requests, mantendo os gatilhos manuais e reutilizáveis existentes.

Foram preservados instalação com npm ci, build TypeScript, lint e testes com PostgreSQL 17. A matriz original de Node 20 e 22 foi preservada para comparar o resultado com a base. Cada job tem limite de 15 minutos e o token do workflow recebe apenas contents: read.

## Nova melhoria: relatório de cobertura como artefato

O script `npm run test:coverage` executa Vitest em modo não interativo com o provedor V8. Foi instalada a versão 3.1.4 de @vitest/coverage-v8, compatível com a versão do Vitest registrada no lockfile.

São produzidos relatórios de terminal, HTML, LCOV e JSON. O escopo inclui src/**/*.ts e exclui somente arquivos de teste; index.ts e logger.ts permanecem no denominador mesmo sem cobertura. A pasta coverage é ignorada pelo Git e pelo ESLint porque contém arquivos gerados.

O workflow usa `actions/upload-artifact@v7` para disponibilizar a pasta coverage ao final de cada job de testes. Os artefatos têm nomes exclusivos por versão: coverage-node-20.x e coverage-node-22.x, com retenção de 30 dias. O upload falha se os arquivos esperados estiverem ausentes.

A melhoria permite inspecionar quais linhas e caminhos ainda não foram exercitados. Não foi definido um percentual mínimo obrigatório nesta etapa: o relatório é informativo. Falhas na instalação, testes, lint ou build continuam falhando o respectivo job; não foi usado continue-on-error.

## Validação local

- 68 testes aprovados.
- Lint e build aprovados.
- Cobertura de linhas: 88,73%; branches: 92,2%; funções: 94,11%.
- Módulos de domínio: 100% nas métricas apresentadas.
- [Saída local de testes e cobertura](evidencias/cobertura-local.txt).

Esses percentuais pertencem à execução local. Os relatórios do GitHub permitem consultar os resultados específicos de cada versão de Node.

## Como reproduzir e consultar

```powershell
npm.cmd ci
npm.cmd run db:up
# Aguardar o PostgreSQL de testes aceitar conexões.
npm.cmd run test:coverage
npm.cmd run lint
npm.cmd run build
```

Para consultar HTML localmente, abrir coverage/index.html. No GitHub, abrir uma execução bem-sucedida de CI, acessar Artifacts e baixar o relatório correspondente à versão de Node. Extrair o ZIP e abrir index.html. Os artefatos expiram após a retenção configurada; uma nova execução pode gerar outro relatório.

## Limitações registradas

A instalação reportou 26 vulnerabilidades nas dependências, incluindo dependências herdadas e de desenvolvimento. Esta melhoria não representa correção dessas vulnerabilidades. Não foram feitas atualizações incompatíveis automáticas.

O primeiro push dos workflows foi bloqueado por ausência do escopo workflow na autenticação do GitHub CLI. Após autorização pelo titular da conta, o envio foi realizado. Nenhuma senha ou token foi incluído no projeto.

## Referências e PR

- [PR da entrega 4](https://github.com/Ricardopbm/campus-events-api/pull/10).
- [Issue de CI](https://github.com/Ricardopbm/campus-events-api/issues/6).
- [Documentação oficial de upload-artifact](https://github.com/actions/upload-artifact).
- [Documentação oficial de cobertura no Vitest](https://vitest.dev/guide/coverage.html).

A branch ci/cobertura-e-verificacoes usa test/regras-eventos-inscricoes como base do PR, isolando esta etapa das anteriores. Nenhum merge ou envio por e-mail foi realizado.

## Evidências remotas verificadas

No commit 5d2c581, as quatro execuções abaixo concluíram com sucesso:

| Evento | Workflow | Execução |
| --- | --- | --- |
| Push em branch de desenvolvimento | CI | [44086012114](https://github.com/Ricardopbm/campus-events-api/actions/runs/44086012114) |
| Push em branch de desenvolvimento | Lint | [44086011809](https://github.com/Ricardopbm/campus-events-api/actions/runs/44086011809) |
| Pull request | CI | [44086040987](https://github.com/Ricardopbm/campus-events-api/actions/runs/44086040987) |
| Pull request | Lint | [44086040808](https://github.com/Ricardopbm/campus-events-api/actions/runs/44086040808) |

Build e testes com cobertura passaram em Node 20 e 22. Foram confirmados dois artefatos de cobertura no CI do PR, um por versão de Node, com upload bem-sucedido.

- [Metadados das execuções](evidencias/execucoes-github.json).
- [Metadados dos artefatos](evidencias/artefatos-github.json).
- [Trechos dos logs de testes, cobertura e upload](evidencias/resumo-ci.txt).

Esses registros referem-se ao commit da implementação, antes deste relatório ser acrescentado. Os links preservam a identificação da execução avaliada.
