# Entrega 5 — Ambiente e publicação

Aluno: Ricardo Minuto. Publicação realizada em 25/11/2026.

A API foi publicada no Render com PostgreSQL 17. O deploy do commit `78aa348182cd73b8bd8f1a9ce706ec0c85a413cd` terminou com sucesso. A validação pública de três endpoints retornou HTTP 200 em 25/11/2026, às 11h40 (Brasília).

## Acesso e validação

URL: https://campus-events-api-ricardopbm.onrender.com

- [GET /health](https://campus-events-api-ricardopbm.onrender.com/health): status da API (`healthy`).
- [GET /health/deep](https://campus-events-api-ricardopbm.onrender.com/health/deep): status da API e conexão com PostgreSQL (`healthy`).
- [GET /events](https://campus-events-api-ricardopbm.onrender.com/events): lista de eventos (vazia na validação inicial).

```powershell
node scripts/check-deploy.mjs https://campus-events-api-ricardopbm.onrender.com
```

O script somente consulta dados e verifica o status e o conteúdo das respostas. Permite até 120 segundos por requisição para acomodar a inicialização da instância gratuita suspensa.

Evidência: [saída da validação pública](evidencias/endpoints-render.txt).

## Ambiente publicado

| Item | Configuração |
| --- | --- |
| Serviço | campus-events-api-ricardopbm — Docker, Free |
| Banco | campus-events-db-ricardopbm — PostgreSQL 17, Free |
| Região | Virginia (US East) |
| Branch | deploy/ambiente-publicacao |
| Commit implantado | 78aa348182cd73b8bd8f1a9ce706ec0c85a413cd |
| Deploy | dep-dc3f6fi9lscs73aiins0 — Deploy succeeded |
| Criação do banco | 25/11/2026, 11h39 (Brasília) |
| Expiração do banco | 25/12/2026, 11h39 (Brasília) |

O painel confirmou ambos os recursos no plano Free e o banco como Available. O serviço levou aproximadamente 36 segundos no primeiro deploy.

- [Painel do deploy](https://dashboard.render.com/web/srv-dc3f6f29lscs73aiimv0/deploys/dep-dc3f6fi9lscs73aiins0) (requer acesso à conta).
- [Blueprint](https://dashboard.render.com/blueprint/exs-dc3f5vetlv9c73c6di8g) (requer acesso à conta).
- [Pull Request da entrega](https://github.com/Ricardopbm/campus-events-api/pull/11).
- [Pesquisa comparativa: VPS/Compose e ECS/Fargate/RDS](alternativas-deploy.md).

## Processo de publicação

1. Importar `render.yaml` do repositório público e da branch `deploy/ambiente-publicacao` no Render, com os dois recursos no plano Free.
2. O Blueprint cria o PostgreSQL e associa sua connection string à variável `DATABASE_URL` da API pela rede interna. Acesso externo ao banco está bloqueado (`ipAllowList: []`).
3. O Render constrói o Dockerfile: instala dependências, compila TypeScript e prepara uma imagem final com dependências de produção. A aplicação executa como usuário `node`, sem privilégios de root.
4. O Render fornece `PORT`; `NODE_ENV` está configurada como `production`. O comando `npm start` aplica migrations antes de iniciar a API.
5. O health check `/health/deep` verifica também o banco. Após o deploy terminar, executar o script de validação acima.

O `.dockerignore` exclui arquivos locais de ambiente, dependências, Git, documentação e cobertura. Credenciais não são incluídas no Git ou nas evidências. `autoDeployTrigger: 'off'` mantém o deploy da aplicação manual; mudanças no Blueprint podem sincronizar a infraestrutura e devem ser revisadas antes do push.

## Limitações e rollback

O banco gratuito expira em **25/12/2026**. A API gratuita suspende com inatividade, e a primeira requisição pode demorar 50 segundos ou mais. Essas condições precisam ser consideradas na avaliação; a URL não representa hospedagem permanente. Nenhum plano pago foi contratado.

O projeto acadêmico ainda não tem autenticação para criar eventos e inscrições. Usar apenas dados fictícios na demonstração pública.

Para voltar a uma versão anterior, selecionar um deploy anterior bem-sucedido no painel e executar Rollback, quando disponível, depois repetir a validação. Isso reverte a aplicação, mas não desfaz migrations. Antes de alterações incompatíveis no banco, planejar backup e restauração. O rollback não foi executado nesta entrega, pois este é o primeiro deploy.

## Validações locais anteriores

A imagem `campus-events-api:entrega5` foi construída e testada localmente com PostgreSQL de desenvolvimento. A primeira requisição ocorreu antes da inicialização e falhou; a repetição após o servidor iniciar passou. O container local de verificação foi parado ao final.

- [Build Docker local](evidencias/build-docker-local.txt).
- [Endpoints do container local](evidencias/endpoints-docker-local.txt).

A evidência remota está separada em `endpoints-render.txt`. Nenhum e-mail foi enviado e os PRs anteriores continuam abertos.

Fontes: [Blueprint do Render](https://render.com/docs/blueprint-spec), [plano gratuito](https://render.com/docs/free) e [rollback](https://render.com/docs/rollbacks), consultadas em 25/11/2026. Estado da implantação e expiração confirmados no painel da conta.
