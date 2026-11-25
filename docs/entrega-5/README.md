# Entrega 5 — Ambiente e publicação (em preparação)

Aluno: Ricardo Minuto. Preparação iniciada em 25/11/2026.

**Estado: ainda não publicado.** A URL pública, o banco remoto, o deploy e a validação remota permanecem pendentes da escolha/conexão da hospedagem. Testes locais não são apresentados como prova de publicação.

## Arquivos preparados

- `render.yaml`: proposta de API e PostgreSQL no plano Free, na mesma região, com banco acessível pela rede interna e DATABASE_URL referenciada sem credencial no Git. Publicação manual para evitar que cada push de documentação provoque redeploy.
- `Dockerfile`: build TypeScript em uma etapa; execução em outra, com dependências de produção e usuário node sem privilégios de root.
- `.dockerignore`: exclui arquivos locais de ambiente, dependências, Git, documentação e relatórios de cobertura do contexto de build.
- `scripts/check-deploy.mjs`: verifica /health, /health/deep e /events e falha quando status/conteúdo não forem os esperados.
- [Pesquisa comparativa de alternativas](alternativas-deploy.md).

## Publicação proposta no Render

1. Conectar a conta de hospedagem e autorizar acesso ao repositório Ricardopbm/campus-events-api.
2. Importar o Blueprint render.yaml da branch deploy/ambiente-publicacao, verificando os dois recursos no plano Free antes da criação.
3. A plataforma constrói a imagem Docker e fornece PORT; DATABASE_URL vem do banco associado. Não copiar o .env de desenvolvimento para o ambiente público.
4. O processo npm start aplica migrations antes de iniciar a API. O health check /health/deep verifica também a conexão com o banco.
5. Registrar URL real, identificadores do serviço/deploy, commit implantado, data de criação/expiração do banco e resultado do deploy.
6. Validar a URL pública com o comando abaixo e salvar a saída como evidência remota.

```powershell
node scripts/check-deploy.mjs https://URL-REAL-DO-SERVICO
```

O script é somente de leitura, verifica três endpoints e permite até 120 segundos por requisição para acomodar a inicialização de uma instância gratuita suspensa. O endereço acima é um marcador, não uma aplicação publicada.

## Configuração e limites

- PORT: fornecida pela hospedagem.
- DATABASE_URL: credencial privada do banco remoto, configurada no serviço; nunca incluir em prints, logs de entrega ou Git.
- NODE_ENV: production.
- No Render Free, o banco expira após 30 dias e a API pode suspender após inatividade. Confirmar as condições no momento da criação e informar a limitação no envio à professora.
- O projeto acadêmico ainda não tem autenticação para criar eventos e inscrições. Usar apenas dados fictícios na demonstração pública.

## Rollback e banco

No painel do serviço, selecionar um deploy anterior bem-sucedido e executar Rollback, quando disponível. Depois repetir o script de validação. Essa operação volta a aplicação, mas não desfaz migrations. Antes de uma mudança incompatível no banco, planejar backup e restauração; não executar migrations down indiscriminadamente em um banco com dados.

## Pendências para concluir

- [ ] Hospedagem conectada e plano confirmado.
- [ ] API e PostgreSQL remotos criados.
- [ ] Deploy concluído e URL pública registrada.
- [ ] Três endpoints validados pela URL pública, incluindo /health/deep.
- [ ] Evidências remotas e link do PR reunidos para o envio.

Nenhum e-mail foi enviado. Os PRs anteriores continuam abertos.

Fontes: [Blueprint do Render](https://render.com/docs/blueprint-spec), [plano gratuito](https://render.com/docs/free) e [rollback](https://render.com/docs/rollbacks), consultadas em 25/11/2026.

## Validação local realizada

Em 25/11/2026, a imagem campus-events-api:entrega5 foi construída com sucesso. Um container com usuário node foi iniciado na porta local 3011, ligado ao PostgreSQL de desenvolvimento. Após a inicialização, /health, /health/deep e /events retornaram HTTP 200 e conteúdo válido. O container de verificação foi parado ao final.

A primeira chamada ocorreu antes de a API terminar a inicialização e falhou na conexão. Após confirmar o log de servidor iniciado, a validação foi repetida com sucesso. O script deve ser executado depois de o deploy ficar pronto.

- [Build Docker local](evidencias/build-docker-local.txt).
- [Endpoints do container local](evidencias/endpoints-docker-local.txt).

Esses registros comprovam somente o teste local, não a publicação na internet.
