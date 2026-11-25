# Campus Events API

API para cadastro e listagem de eventos de um campus e inscrições com controle de vagas, data de início e duplicidade de e-mail. Base: [BeahIF/campus-events-api](https://github.com/BeahIF/campus-events-api).

## Versão e acesso

A versão com eventos, inscrições, regras de domínio, testes, CI e deploy está na branch **deploy/ambiente-publicacao**. Os PRs ainda estão em integração; a main não contém todas essas funcionalidades. A refatoração do PR #12 foi integrada à branch feat/inscricoes-eventos e ainda precisa ser conciliada com as etapas posteriores.

API: https://campus-events-api-ricardopbm.onrender.com

Saúde da API e do banco: https://campus-events-api-ricardopbm.onrender.com/health/deep

O banco gratuito expira em **25/12/2026**. A primeira requisição após inatividade pode demorar 50 segundos ou mais.

## Configuração e execução local

Requisitos: Git, Node.js 22 com npm e Docker Desktop iniciado. A pipeline também verifica Node 20. Exemplos para PowerShell:

```powershell
git clone --branch deploy/ambiente-publicacao https://github.com/Ricardopbm/campus-events-api.git
cd campus-events-api
Copy-Item .env.example .env
npm.cmd ci
npm.cmd run db:up
docker compose exec -T postgres-dev pg_isready -U api -d api_dev
docker compose exec -T postgres-test pg_isready -U api -d api_test
```

Aguardar ambos os bancos aceitarem conexões. Se já existir .env, preservar a configuração local em vez de sobrescrever.

```powershell
npm.cmd run dev
# Em outro terminal
Invoke-RestMethod http://localhost:3001/health/deep
```

A aplicação aplica as migrations pendentes antes de iniciar. Para executar compilada, usar `npm.cmd run build` e `npm.cmd start`. Encerrar com Ctrl+C e parar os bancos com `docker compose stop`.

| Variável | Exemplo local | Uso |
| --- | --- | --- |
| PORT | 3001 | Porta HTTP |
| DATABASE_URL | postgres://api:password@localhost:4329/api_dev | Banco de desenvolvimento |
| TEST_PORT | 3002 | Configuração de testes |
| TEST_DATABASE_URL | postgres://api:password@localhost:4328/api_test | Banco descartável de testes |
| NODE_ENV | production no deploy | Ambiente de execução |

As credenciais de exemplo são somente de desenvolvimento. .env é ignorado pelo Git. Não publicar credenciais de produção.

## Banco e Docker

O Compose inicia somente os bancos PostgreSQL 17: api_dev na porta 4329 e api_test na 4328. Não inclui a API nem define volumes nomeados; recriar containers pode perder dados locais. Essa configuração não é uma estratégia de armazenamento durável para produção.

As migrations criam people, events e registrations. Inscrições possuem chave estrangeira para eventos e unicidade de e-mail por evento. A suíte de integração aplica e desfaz migrations: **nunca apontar TEST_DATABASE_URL para produção ou dados que precisam ser preservados**.

O Dockerfile compila TypeScript em uma etapa e executa o resultado em outra, com dependências de produção e usuário node. .dockerignore exclui ambiente local, Git, dependências e relatórios gerados. Exemplo para Docker Desktop, com o banco local iniciado:

```powershell
docker build -t campus-events-api:local .
docker run --rm -p 127.0.0.1:3011:3001 `
  -e PORT=3001 `
  -e DATABASE_URL=postgres://api:password@host.docker.internal:4329/api_dev `
  campus-events-api:local
```

## Endpoints

| Método e caminho | Finalidade | Sucesso |
| --- | --- | --- |
| GET /health | Saúde da API | 200 |
| GET /health/deep | Saúde da API e do banco | 200 |
| GET /events | Lista ordenada por início e id | 200 com array |
| POST /events | Criar evento | 201 com evento |
| POST /events/:eventId/registrations | Inscrever participante | 201 com inscrição |
| GET /people | Listar pessoas do template | 200 com array |
| POST /people | Criar pessoa do template | 200 com nome e idade |

Evento exige título de 1 a 255 caracteres após trim, descrição opcional de até 10.000, data ISO 8601 com fuso estritamente futura e capacidade inteira de 1 a 2.147.483.647. Inscrição exige nome de 1 a 255 caracteres e e-mail válido de até 254, normalizado com trim e minúsculas.

Exemplo local com dados fictícios e data calculada para amanhã:

```powershell
$base = 'http://localhost:3001'
$body = @{
  title = 'Oficina de desenvolvimento'
  description = 'Evento de demonstracao'
  startsAt = (Get-Date).ToUniversalTime().AddDays(1).ToString('o')
  capacity = 1
} | ConvertTo-Json
$evento = Invoke-RestMethod -Method Post -Uri "$base/events" `
  -ContentType 'application/json' -Body $body
$evento
Invoke-RestMethod "$base/events"
$inscrito = @{name='Participante exemplo';email='aluno@example.com'} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/events/$($evento.id)/registrations" `
  -ContentType 'application/json' -Body $inscrito
```

Evento retorna id, title, description, startsAt e capacity. Inscrição retorna id, eventId, name, email e createdAt. Datas são ISO 8601; IDs e timestamps são gerados pelo banco. Repetir a inscrição produz conflito por duplicidade; outro e-mail encontra lotação no evento de capacidade 1.

Entradas inválidas retornam **400**; evento inexistente, **404**; evento iniciado, duplicidade ou lotação, **409**. Exemplo de erro: `{"status":400,"message":"Invalid request","name":"ZodError"}`. POST /people recebe name não vazio e age maior que zero e até 150; não cria inscrição automaticamente.

## Arquitetura e decisões

Cliente HTTP → Express e middleware → rotas e validação → regras de domínio → consultas SQL → PostgreSQL.

- src/index.ts: configuração, migrations e inicialização.
- src/app.ts: composição e injeção de consultas e middleware.
- src/routes e src/controllers: contratos HTTP.
- src/domain: regras puras de eventos e inscrições.
- src/database: pool, consultas, tipos e migrations.
- src/middleware: logs Pino, identificador da requisição e erros.
- migrations: esquema SQL versionado.

TypeScript oferece tipagem; Express trata HTTP; Zod valida entradas; pg acessa PostgreSQL; node-pg-migrate controla o esquema. validateEvent(input, now) recebe o instante de referência para testes determinísticos. evaluateRegistration(state, now) decide elegibilidade sem HTTP ou banco. A persistência inicia transação e usa SELECT ... FOR UPDATE no evento antes de verificar vagas e duplicidade. Esse bloqueio protege requisições concorrentes; a função pura não substitui o controle transacional. Consultas usam parâmetros e conexões são liberadas em finally.

## Testes e integração contínua

```powershell
npm.cmd test -- --run src/domain
npm.cmd test -- --run
npm.cmd run test:coverage
npm.cmd run lint
npm.cmd run build
```

Somente os testes de domínio dispensam PostgreSQL. A suíte da versão com regras isoladas tem 68 testes: 28 unitários e 40 de rotas, consultas e integração. Inclui sucesso, erro, limites temporais, última vaga, duplicidade e concorrência. Abrir coverage/index.html para consultar o relatório local.

CI e Lint executam em qualquer push e em PRs, além dos gatilhos manuais e reutilizáveis. CI instala com npm ci, compila e testa em Node 20/22 com PostgreSQL 17; lint usa Node 22. Cada job tem timeout de 15 minutos e permissão contents: read. actions/upload-artifact@v7 publica cobertura por versão de Node com retenção de 30 dias. Não há limiar mínimo de cobertura configurado.

## Publicação e validação

render.yaml define Web Service Docker e PostgreSQL no plano Free, na região Virginia. DATABASE_URL vem da conexão interna; PORT é fornecida pelo Render e NODE_ENV vale production. Acesso externo ao banco está bloqueado. O health check é /health/deep. O deploy inicial usa o commit 78aa348.

O deploy da aplicação é manual (autoDeployTrigger: off). Mudanças no Blueprint podem sincronizar a infraestrutura e precisam ser revisadas antes do push.

```powershell
node scripts/check-deploy.mjs https://campus-events-api-ricardopbm.onrender.com
```

O script consulta /health, /health/deep e /events, valida status e conteúdo e permite até 120 segundos por requisição. Repetir após deploy ou rollback. Voltar a uma versão anterior não desfaz migrations; alterações incompatíveis de esquema exigem plano de backup e restauração.

## Limitações e evolução

Projeto acadêmico sem interface gráfica, autenticação, autorização, edição ou cancelamento de eventos e inscrições. Usar dados fictícios. A instalação registrou vulnerabilidades em dependências que precisam de avaliação e atualização. Antes de uso real, são necessários backups, monitoramento, revisão de segurança e armazenamento durável. A hospedagem gratuita é temporária.

Evoluções possíveis: autenticação, controle de acesso, limites de requisições, paginação, consulta de participantes e documentação OpenAPI.
