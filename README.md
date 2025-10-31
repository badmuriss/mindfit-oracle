# MindFit - Plataforma Completa de Gestão Fitness

Uma plataforma full-stack de saúde e bem-estar com recursos de IA, construída com Spring Boot, Angular, Expo/React Native Web e Oracle Database.

## 🌟 Funcionalidades

### Funcionalidades principais
- **Gestão de usuários**: cadastro, autenticação e administração completa dos perfis.
- **Base de alimentos USDA**: busca e registro de refeições usando dados oficiais do USDA, com cache inteligente e limite de requisições.
- **Registro de exercícios**: acompanhamento de treinos, séries personalizadas e estimativa de calorias.
- **Acompanhamento de peso**: gráficos SVG customizados para evolução corporal.
- **Assistente IA**: chatbot com OpenAI para orientações de nutrição e treino.

### Recursos com IA
- **Chatbot inteligente**: respostas personalizadas para dúvidas sobre nutrição e atividades físicas.
- **Geração de perfil**: criação automática de perfis e planos personalizados baseados nos dados do usuário.
- **Recomendações inteligentes**: sugestões de refeições e treinos com base no histórico e metas.

### Painel administrativo
- **Gestão de usuários**: leitura, criação, edição e exclusão, incluindo campos de idade e sexo.
- **Painel analítico**: métricas de atividade e evolução dos usuários.
- **Logs do sistema**: monitoramento de ações e eventos críticos.
- **Gestão de conteúdo**: configuração de parâmetros globais da aplicação.

## 🏗 Arquitetura

### Backend (API Spring Boot)
- **Stack**: Spring Boot 3.5.4 com Java 21.
- **Banco de dados**: Oracle Database XE integrado via Spring Data JPA.
- **Segurança**: autenticação baseada em JWT com controle de acesso por perfil.
- **Integração IA**: uso do Spring AI com modelos OpenAI.
- **Documentação de API**: Swagger/OpenAPI 3.0.
- **Rate limiting**: proteção nativa contra abuso de endpoints.

### Frontends
- **Painel Admin (Angular 20)**: dashboard completo para administradores.
- **Aplicativo (Expo/React Native Web)**: experiência para usuários finais com gráficos, IA e integração USDA.
- **UI**: Angular Material + Tailwind no admin; React Native Paper no app.
- **Gerência de estado**: formulários reativos e services dedicados.
- **Gráficos**: SVG customizado para acompanhamento de peso.
- **Autenticação**: JWT com guards e interceptors.

### Infraestrutura
- **Banco**: Oracle Database XE 21c.
- **Contêineres**: Docker + Docker Compose (opcional para desenvolvimento e entrega).
- **Proxy**: Nginx servindo os frontends em modo produção.
- **Dev Experience**: hot reload disponível para backend e frontends.

## ⚠️ Configuração Importante

### Antes de executar o projeto:

1. **Portas em uso**: Se já houver um Oracle rodando na porta 1521, o projeto foi configurado para usar a porta **1522**.

2. **Variáveis de ambiente**: Crie um arquivo `.env` baseado no `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. **Primeiro uso**: No primeiro start, o Oracle pode demorar 2-3 minutos para inicializar.

### Solução de problemas comuns:

- **Erro "port already in use"**: Outro serviço está usando a porta. Verifique com `netstat -an | findstr 1521`
- **API não conecta no Oracle**: Aguarde o healthcheck mostrar `healthy` com `docker-compose ps`
- **Tabelas não existem**: Execute `docker-compose restart api` após o Oracle estar saudável

## 🚀 Guia Rápido

### Pré-requisitos
- Docker e Docker Compose instalados.
- Git configurado no ambiente.

### 1. Clonar o repositório
```bash
git clone https://github.com/Freitassync/mindfit-oracle.git
cd mindfit-oracle
```

### 2. (Opcional) definir variáveis de ambiente
Crie um arquivo `.env` na raiz para sobrescrever valores padrão:

```env
# Oracle Database
SPRING_DATASOURCE_URL=jdbc:oracle:thin:@localhost:1521/XEPDB1
SPRING_DATASOURCE_USERNAME=mindfit
SPRING_DATASOURCE_PASSWORD=mindfit

# JWT
JWT_SECRET=troque-para-um-valor-forte

# OpenAI
OPENAI_API_KEY=sua-chave-openai

# CORS
APP_CORS_ALLOWED_ORIGINS=http://localhost:8082,http://localhost:8083,http://localhost:4200

# API Base URL para frontends
API_BASE_URL=http://localhost:8088

# Chave USDA Food Data Central
USDA_API_KEY=DEMO_KEY
```

### 3. Subir com Docker Compose
```bash
docker-compose up --build
```

Por padrão:
- **API**: http://localhost:8088
- **Painel Admin**: http://localhost:8082
- **App Web (bundle estático)**: http://localhost:8083

Se preferir um Oracle externo, ajuste `SPRING_DATASOURCE_URL/USERNAME/PASSWORD` no `.env` ou diretamente no compose.

### 4. Acessar os módulos
- **Painel Admin**
  - URL: http://localhost:8082
  - Credenciais iniciais: `admin@example.com` / `password`
- **Swagger UI**: http://localhost:8088/swagger-ui.html
- **Documentação JSON**: http://localhost:8088/api-docs
- **App Web**: http://localhost:8083

## 🔐 Usuário padrão

Ao iniciar a API pela primeira vez, um super administrador é criado automaticamente.
- E-mail: `admin@example.com`
- Senha: `password`
- Perfil: `SUPER_ADMIN`

> ⚠️ Altere a senha assim que possível.

## 📱 Endpoints principais

### Autenticação
- `POST /auth/user/login`
- `POST /auth/user/signup`
- `POST /auth/admin/login`
- `POST /auth/admin/signup`

### Usuários
- `GET /users`
- `GET /users/{id}`
- `PUT /users/{id}`
- `DELETE /users/{id}`
- `POST /users/{id}/generate-profile`
- `GET /users/{id}/consumption-report` *(agregado via stored procedure Oracle)*

### Refeições
- CRUD completo em `/users/{userId}/meals`

### Exercícios
- CRUD completo em `/users/{userId}/exercises`

### Medidas corporais
- CRUD completo em `/users/{userId}/measurements`

### IA
- `POST /users/{userId}/chatbot`
- `DELETE /users/{userId}/chatbot/history`

### Logs
- `GET /logs`
- `POST /logs`

## 🔧 Desenvolvimento local

### API Spring Boot
```bash
cd mindfit-api
./mvnw spring-boot:run
```
A API sobe em http://localhost:8088.

### Painel Admin (Angular)
```bash
cd mindfit-admin-panel
npm install
npm start
```
Servido em http://localhost:4200.

### App (Expo Web)
```bash
cd mindfit-app
npm install
npm run web
```
Por padrão o Expo usa http://localhost:19006; para build estático utilize o Docker Compose (porta 8083).

### Acesso ao Oracle
```bash
# Shell SQL dentro do contêiner
docker exec -it mindfit-oracle sqlplus mindfit/mindfit@//localhost:1521/FREE

# Via SQLcl instalado localmente
sqlcl mindfit/mindfit@//localhost:1521/FREE

# Consultas úteis
SELECT table_name FROM user_tables ORDER BY table_name;
SELECT fn_calculate_bmi('11111111-1111-1111-1111-111111111111') FROM dual;
CALL sp_generate_user_consumption_report('11111111-1111-1111-1111-111111111111', :total, :burned, :net);
```

## 🗄️ Database Migrations (Flyway)

Este projeto utiliza **Flyway** para gerenciamento de schema do Oracle Database. As migrations são executadas automaticamente ao iniciar a aplicação.

### Estrutura de Migrations
```
mindfit-api/src/main/resources/db/migration/
├── V1__baseline_schema.sql           # Schema inicial completo
├── V2__add_updated_at_columns.sql    # Adiciona colunas updated_at
└── V3__create_updated_at_triggers.sql # Triggers Oracle para auto-update
```

### Características
- **Auto-gerenciamento de timestamps**: Triggers Oracle atualizam automaticamente `updated_at` em modificações de registros
- **Baseline automático**: `baseline-on-migrate: true` permite migrar bancos existentes
- **Validação**: Flyway valida o schema no startup para garantir consistência
- **Versionamento**: Histórico de migrations armazenado na tabela `flyway_schema_history`

### Executar migrations manualmente
```bash
cd mindfit-api
./mvnw flyway:migrate
./mvnw flyway:info    # Ver status das migrations
```

## 🧪 Testes Automatizados

O projeto implementa testes em múltiplas camadas:

### Infraestrutura de Testes
- **Framework**: JUnit 5 + Spring Boot Test
- **Database**: H2 in-memory para testes (modo compatibilidade Oracle)
- **Mocking**: Mockito para testes unitários
- **Assertions**: AssertJ para asserções fluentes
- **Cobertura**: JaCoCo para relatórios de code coverage

### Estrutura de Testes
```
mindfit-api/src/test/java/
├── AbstractIntegrationTest.java        # Classe base para testes de integração
├── util/TestDataBuilder.java           # Builders para dados de teste
├── repository/                         # Testes de repositórios
│   ├── UserRepositoryTest.java
│   ├── MealRegisterRepositoryTest.java
│   └── ExerciseRegisterRepositoryTest.java
└── service/                            # Testes de serviços com mocks
    └── UserServiceTest.java
```

### Executar testes
```bash
cd mindfit-api

# Rodar todos os testes
./mvnw test

# Rodar testes com coverage
./mvnw clean verify

# Ver relatório de coverage
open target/site/jacoco/index.html
```

### Configuração de Testes
- Profile de teste: `application-test.yml`
- H2 configurado em modo Oracle para compatibilidade
- Flyway desabilitado nos testes (usa Hibernate create-drop)
- Cleanup automático entre testes via `@Transactional`

## 🔄 CI/CD Pipeline

O projeto utiliza **GitHub Actions** para integração e entrega contínua.

### Workflow Principal (.github/workflows/ci.yml)
```yaml
Triggers:
  - Push para master
  - Pull Requests para master

Jobs:
  1. test-and-build
     - Build Maven com cache
     - Execução de todos os testes
     - Geração de relatórios (JUnit, JaCoCo)
     - Build de Docker images (validação)
     - Upload de artifacts (testes, coverage)

  2. security-scan
     - OWASP Dependency Check
     - Análise de vulnerabilidades

  3. code-quality
     - Checkstyle
     - Análise estática de código

  4. deploy-notification
     - Confirmação de CI/CD bem-sucedido
     - Sinal para Coolify realizar auto-deploy
```

### Coolify Auto-Deploy
Após o CI passar com sucesso:
1. GitHub Actions valida código, testes e build
2. Merge para `master` é permitido apenas se CI passar
3. **Coolify monitora push na master**
4. **Deploy automático é acionado** pelo Coolify
5. Aplicação é atualizada em produção

### Proteção de Branch
Recomenda-se configurar no GitHub:
```
Settings → Branches → Branch protection rules
✓ Require status checks to pass before merging
✓ Require branches to be up to date before merging
```

## 🛠 Configuração

### Variáveis de ambiente
- `SPRING_PROFILES_ACTIVE`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `APP_CORS_ALLOWED_ORIGINS`
- `LOGS_BASIC_USERNAME`
- `LOGS_BASIC_PASSWORD`

### Arquivos de configuração
- `application.yml` (perfil default)
- Sobrescritas via variáveis em runtime.

## 📊 Modelos de dados (exemplos JSON)

### User
```json
{
  "id": "string",
  "email": "string",
  "password": "hashed",
  "roles": ["USER", "ADMIN", "SUPER_ADMIN"],
  "profile": "string",
  "lastLogonDate": "datetime",
  "createdAt": "datetime",
  "enabled": true
}
```

### Meal Register
```json
{
  "id": "string",
  "userId": "string",
  "name": "string",
  "description": "string",
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0,
  "date": "datetime"
}
```

### Exercise Register
```json
{
  "id": "string",
  "userId": "string",
  "name": "string",
  "description": "string",
  "duration": 0,
  "calories": 0,
  "date": "datetime"
}
```

### Measurements Register
```json
{
  "id": "string",
  "userId": "string",
  "type": "string",
  "value": 0,
  "unit": "string",
  "date": "datetime"
}
```

## 🔒 Segurança
- Autenticação via JWT.
- Controle de acesso por papéis (USER, ADMIN, SUPER_ADMIN).
- Senhas com hashing BCrypt.
- CORS configurável por ambiente.
- Rate limiting com Bucket4j.
- Validações robustas de entrada.
- Cabeçalhos de segurança aplicados pelo backend.

## 🚀 Deploy

### Docker Compose (produção)
```bash
docker-compose up -d --build
```

### Ajustes por ambiente
- Ajuste variáveis de ambiente.
- Configure conexões Oracle específicas por ambiente.
- Adicione certificados TLS para produção.
- Defina chaves externas (OpenAI, USDA etc.).

## 🤝 Contribuição
1. Fork no repositório.
2. Branch (`git checkout -b feature/sua-funcionalidade`).
3. Commit (`git commit -m "feat: adiciona funcionalidade"`).
4. Push (`git push origin feature/sua-funcionalidade`).
5. Abra um Pull Request.

## 📝 Licença
Projeto licenciado sob MIT. Consulte `LICENSE` para detalhes.

## 🆘 Troubleshooting

### Conexão Oracle
```bash
docker logs mindfit-oracle

docker exec mindfit-oracle lsnrctl status

docker exec -it mindfit-oracle sqlplus mindfit/mindfit@//localhost:1521/FREE
```

### API não inicia
```bash
docker logs mindfit-api

docker exec mindfit-api env | Select-String "SPRING_DATASOURCE" -SimpleMatch
```

### Build do frontend falhou
```bash
docker logs mindfit-admin-panel

docker-compose up --build mindfit-admin-panel
```

### Problemas de autenticação
- Confirme `JWT_SECRET` uniforme.
- Verifique se o super admin foi criado.
- Garanta que os frontends apontem para a mesma URL base da API.

### Observabilidade
- Logs API: `docker logs mindfit-api`
- Logs Oracle: `docker logs mindfit-oracle`
- Logs Frontends: `docker logs mindfit-admin-panel`
- Monitoramento pelo painel em `/logs`

## 📞 Suporte
1. Consulte o troubleshooting acima.
2. Revisite o Swagger em http://localhost:8088/swagger-ui.html.
3. Analise os logs de aplicação.
4. Abra uma issue no repositório.

---

**MindFit** – Tecnologia inteligente fortalecendo sua jornada fitness! 💪🧠
