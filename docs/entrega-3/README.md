# Entrega 3 — Funcionalidade testada

Aluno: Ricardo Minuto. Execução: 15/11/2026. Trabalho individual.

## Funcionalidades escolhidas

### 1. Cadastro de eventos

A função `validateEvent(input, now)`, em `src/domain/events.ts`, valida título, descrição, data/hora e capacidade. O título deve conter texto após remover espaços; a data deve ser ISO 8601 com fuso e estritamente posterior ao instante de referência; a capacidade deve ser inteira positiva dentro do intervalo suportado pelo PostgreSQL.

A função recebe a entrada e o instante de referência em milissegundos, sem consultar relógio global, HTTP, Express ou banco. Retorna dados validados e normalizados; entradas inválidas geram ZodError. A rota `POST /events` chama essa função passando `Date.now()`, e o middleware traduz ZodError para HTTP 400. A rejeição de data passada passa a usar o mesmo formato ZodError das demais entradas inválidas, mantendo o status 400.

### 2. Elegibilidade para inscrição

A função `evaluateRegistration(state, now)`, em `src/domain/registrations.ts`, recebe data do evento, capacidade, quantidade de inscritos, indicação de inscrição prévia e instante de referência. Retorna autorização ou motivo de recusa: evento iniciado, duplicidade ou lotação. Essa ordem também define a prioridade quando há mais de um motivo.

Permite a última vaga, mas rejeita quando a quantidade já atingiu ou ultrapassou a capacidade. No instante exato do início, a inscrição já é recusada. Estado interno inconsistente, como capacidade zero ou contagem negativa, gera RangeError.

O fluxo `addRegistration` consulta o estado do banco dentro da transação, após bloquear a linha do evento com `FOR UPDATE`, e chama a função de domínio. A camada de persistência converte a recusa em HttpError 409 e realiza rollback. O domínio não conhece códigos HTTP nem PostgreSQL. O bloqueio continua protegendo a decisão contra inscrições simultâneas; a função pura, isoladamente, não controla concorrência.

## Testes unitários e casos de limite

| Funcionalidade | Sucesso | Erro | Limite |
| --- | --- | --- | --- |
| Eventos | Evento futuro e título normalizado | Capacidade inválida, título vazio, data inválida/sem fuso | Capacidade 1, início exatamente agora e 1 ms antes/depois |
| Inscrições | Participante novo em evento com vagas | Duplicidade, evento iniciado, estado interno inválido | Última vaga, lotação, início exatamente agora e 1 ms antes |

Os testes usam referência fixa `2030-01-01T12:00:00Z`; não dependem da data real de execução, rede, servidor HTTP ou banco. Também cobrem equivalência entre fusos horários, excesso de lotação e prioridade dos motivos de recusa.

- `src/domain/events.test.ts`: **15 testes**.
- `src/domain/registrations.test.ts`: **13 testes**.
- Total de novos testes unitários: **28**.
- Suíte completa: **68 testes aprovados em 7 arquivos**, incluindo os 40 testes anteriores de integração/rotas/consultas.

## Comandos e evidências

Executar na raiz do projeto, com dependências instaladas:

```powershell
# Somente regras de domínio; não precisa iniciar o PostgreSQL.
npm.cmd test -- --run src/domain

# Suíte completa; requer o banco de testes pronto e o .env configurado.
npm.cmd test -- --run
npm.cmd run lint
npm.cmd run build
```

- [Saída dos 28 testes unitários](evidencias/unitarios.txt).
- [Saída da suíte completa com 68 testes](evidencias/suite-completa.txt).
- [Lint aprovado](evidencias/lint.txt).
- [Build aprovado](evidencias/build.txt).

Os testes de integração existentes continuam exercitando as rotas reais com PostgreSQL, inclusive concorrência pela última vaga e duplicidade simultânea. Isso verifica a integração das funções de domínio com as funcionalidades, além da sua execução isolada.

## Histórico e entrega

Issue relacionada: [Regras de domínio e testes](https://github.com/Ricardopbm/campus-events-api/issues/4).

Branch: `test/regras-eventos-inscricoes`, criada a partir de `feat/inscricoes-eventos`. O PR usa essa branch anterior como base para mostrar somente as alterações desta etapa, pois os PRs da entrega 2 ainda estão abertos. Nenhum merge ou envio por e-mail foi realizado nesta etapa.
