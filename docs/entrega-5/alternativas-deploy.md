# Entrega 5 — Pesquisa de alternativas de deploy

Consulta às fontes: 25/11/2026. As arquiteturas abaixo são propostas de implantação para o Campus Events API; não são ambientes que já foram criados. Render é a opção de referência em avaliação para a Parte A, cuja publicação ainda depende da conexão da conta.

## Referência: Render com PostgreSQL gerenciado

A API pode executar como Web Service, usando o Dockerfile do repositório, e acessar Render Postgres na mesma região por conexão interna. O serviço recebe PORT da plataforma e DATABASE_URL como configuração secreta. O build gera o TypeScript; npm start inicia a aplicação e aplica migrations antes de abrir a porta. HTTPS e a URL pública são fornecidos pela hospedagem.

A opção Free atende a uma demonstração acadêmica, mas a API pode suspender por inatividade e o PostgreSQL gratuito expira após 30 dias. O plano e a expiração devem ser registrados quando os recursos forem efetivamente criados. Não se deve pressupor disponibilidade permanente nem backup gerenciado no banco gratuito. [Fonte: planos gratuitos](https://render.com/docs/free).

## Alternativa 1 — VPS com Docker Compose e Nginx

**Arquitetura proposta:** internet → Nginx com HTTPS → container Node.js; PostgreSQL em outro container, em rede privada do Compose, com volume persistente. A VM hospeda os três serviços. A porta do banco não deve ser publicada na internet.

**Ferramentas:** VPS Linux, Docker Engine/Compose, Nginx, certificado TLS, registro de imagens e rotina de backup do PostgreSQL. O Compose permite adaptar a configuração de desenvolvimento para um servidor, mas segurança, atualizações e recuperação ficam sob responsabilidade de quem opera a VM. [Fonte: Compose em produção](https://docs.docker.com/compose/how-tos/production/).

**Build e deploy propostos:** gerar imagem pelo Dockerfile, publicar com tag correspondente ao commit e atualizar o serviço da API. Validar /health, /health/deep e /events após a atualização. Manter o banco e seu volume separados do ciclo de substituição da API.

**Variáveis e secrets:** PORT é configuração comum. DATABASE_URL deve ser entregue somente ao container da API por mecanismo protegido. Compose pode montar secrets como arquivos em /run/secrets; como a aplicação atual lê DATABASE_URL do ambiente, usar esse mecanismo exigiria um pequeno adaptador de inicialização para ler o arquivo e exportar a variável. Arquivos secretos ficariam fora do Git, com acesso restrito. [Fonte: secrets do Compose](https://docs.docker.com/compose/how-tos/use-secrets/).

**Rollback proposto:** restaurar a tag anterior da imagem e recriar somente a API. O volume do banco permanece. Antes de migrations incompatíveis, gerar backup e planejar restauração; voltar a imagem não desfaz alterações no banco.

**Vantagens:** controle da infraestrutura, portabilidade do container e menor dependência de recursos específicos de um provedor.

**Limitações:** manutenção do sistema operacional, TLS, firewall, monitoramento, backups e disponibilidade ficam por conta da equipe. Uma única VM é ponto de falha.

**Complexidade estimada:** maior que a referência Render, pois exige operar o servidor e o banco. A classificação é uma avaliação para este projeto acadêmico, não uma medida universal.

## Alternativa 2 — AWS ECS/Fargate com RDS PostgreSQL

**Arquitetura proposta:** internet → Application Load Balancer → serviço ECS com tarefas Fargate em uma VPC → RDS PostgreSQL em rede privada. A API executa em containers; o banco é um serviço gerenciado separado. A imagem fica no ECR. ECS orquestra os containers e integra-se com os serviços da AWS. [Fonte: visão geral do ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html).

**Ferramentas:** ECS/Fargate, ECR, RDS, ALB, VPC, security groups, IAM, CloudWatch e Secrets Manager ou Parameter Store. Esta é uma proposta; nenhum recurso AWS foi contratado.

**Build e deploy propostos:** gerar e publicar a imagem no ECR; criar uma revisão da task definition referenciando a imagem; atualizar o serviço ECS. Para múltiplas réplicas, executar migrations como etapa controlada antes da atualização, em vez de depender da inicialização simultânea de cada réplica. Usar health checks e conferir os endpoints após o deploy.

**Variáveis e secrets:** configurações comuns na task definition; credenciais em Secrets Manager ou Parameter Store, entregues por permissões IAM restritas. Quando um secret muda, as tarefas precisam ser renovadas para receber o novo valor. [Fonte: secrets no ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specifying-sensitive-data.html).

**Rollback proposto:** voltar à revisão anterior da task definition. Em rolling deployments, o deployment circuit breaker pode reverter automaticamente uma implantação malsucedida quando existe uma implantação anterior concluída. Isso não restaura o banco. [Fonte: circuit breaker](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-circuit-breaker.html).

**Vantagens:** separação de responsabilidades, possibilidade de escalar containers e integração com serviços gerenciados de observabilidade e banco.

**Limitações:** configuração de rede/IAM mais extensa, vários componentes cobrados e necessidade de controlar custos e operação. Não se presume gratuidade.

**Complexidade estimada:** superior a Render e a uma VPS simples para esta atividade, devido à quantidade de serviços e configurações.

## Comparação

| Aspecto | Render (referência em avaliação) | VPS + Compose | ECS/Fargate + RDS |
| --- | --- | --- | --- |
| Local da API | Web Service | Container na VM | Tarefas Fargate |
| Local do banco | Postgres gerenciado | Container com volume | RDS privado |
| Gestão do servidor | Plataforma | Equipe | Capacidade gerenciada por Fargate |
| Secrets | Configuração protegida do serviço | Arquivo protegido/adaptação para secrets | Secrets Manager/Parameter Store e IAM |
| Rollback da API | Deploy anterior | Imagem anterior | Task definition anterior/circuit breaker |
| Complexidade para a atividade | Menor | Intermediária | Maior |

No Render, é possível voltar a um deploy anterior disponível pelo painel. O rollback da aplicação não deve ser confundido com reversão das migrations ou restauração dos dados. [Fonte: rollbacks do Render](https://render.com/docs/rollbacks).

Para este projeto, a recomendação provisória é a plataforma gerenciada por reduzir a configuração necessária à demonstração. A escolha final e as evidências da Parte A serão registradas no relatório de publicação depois do deploy real.
