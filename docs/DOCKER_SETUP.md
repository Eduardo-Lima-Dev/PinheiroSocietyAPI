# 🐳 Guia de Configuração com Docker

Este guia explica como configurar e executar o projeto usando Docker Compose.

## 📋 Pré-requisitos

### Windows
1. **Docker Desktop para Windows**
   - Baixe em: https://www.docker.com/products/docker-desktop
   - Instale e inicie o Docker Desktop
   - Certifique-se de que o Docker está rodando (ícone na bandeja do sistema)

2. **Node.js** (versão 18 ou superior)
   - Baixe em: https://nodejs.org/
   - Verifique a instalação: `node --version`

3. **Git** (opcional, se não tiver o código)
   - Baixe em: https://git-scm.com/download/win

### Linux/Mac
1. **Docker** e **Docker Compose**
   ```bash
   # Verificar instalação
   docker --version
   docker-compose --version
   ```

2. **Node.js** (versão 18 ou superior)
   ```bash
   node --version
   ```

## 🚀 Passo a Passo

### ⚠️ Importante: O que o Docker Compose faz?

O `docker-compose.yml` atual **NÃO inclui o backend**. Ele apenas inicia:
- ✅ **PostgreSQL** (banco de dados)
- ✅ **Adminer** (interface web para gerenciar o banco)

A **API Node.js** precisa ser executada **separadamente** localmente.

### 1. Configure as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
# Configuração da API
PORT=3000
JWT_SECRET=seu-jwt-secret-aqui-mude-em-producao

# Configuração do PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=pinheiro_society

# URL de conexão do banco (usando o hostname do container)
DATABASE_URL=postgresql://postgres:postgres@localhost:5344/pinheiro_society
```

**⚠️ Importante no Windows:**
- O arquivo `.env` deve usar **LF** (Unix line endings) ou **CRLF** (Windows line endings) - ambos funcionam
- Não use aspas nas variáveis (a menos que o valor contenha espaços)
- O Docker Desktop no Windows funciona perfeitamente com essas configurações

### 2. Inicie os Containers Docker

Abra o terminal na pasta do projeto e execute:

**Windows (PowerShell ou CMD):**
```powershell
docker-compose up -d
```

**Linux/Mac:**
```bash
docker-compose up -d
```

**O que acontece:**
- ✅ Baixa as imagens do PostgreSQL e Adminer (se não tiver)
- ✅ Cria os containers
- ✅ Inicia os serviços em background (`-d` significa detached mode)

**Verificar se está rodando:**
```bash
docker-compose ps
```

Você deve ver algo como:
```
NAME                        STATUS          PORTS
pinheiro_society_adminer    Up              0.0.0.0:8080->8080/tcp
pinheiro_society_db         Up              0.0.0.0:5344->5432/tcp
```

### 3. Instale as Dependências do Projeto

```bash
npm install
```

### 4. Configure o Prisma

Execute as migrações do banco de dados:

```bash
npx prisma migrate dev
```

**O que acontece:**
- ✅ Cria as tabelas no banco de dados
- ✅ Gera o cliente Prisma

### 5. Inicie a API

```bash
npm run dev
```

A API estará disponível em:
- 🌐 **API**: http://localhost:3000
- 📚 **Swagger**: http://localhost:3000/api-docs
- ❤️ **Health Check**: http://localhost:3000/health

## 📋 Resumo: O que precisa rodar?

### Primeira vez (setup inicial):
```bash
# 1. Inicia apenas o banco de dados (PostgreSQL)
docker-compose up -d

# 2. Instala dependências (só na primeira vez)
npm install

# 3. Cria as tabelas no banco (só na primeira vez ou quando houver novas migrações)
npx prisma migrate dev

# 4. Inicia a API (backend)
npm run dev
```

### Próximas vezes (após setup inicial):
```bash
# 1. Inicia o banco (se não estiver rodando)
docker-compose up -d

# 2. Inicia a API
npm run dev
```

### ⚠️ Lembre-se:
- **PostgreSQL** roda no Docker (via `docker-compose up -d`)
- **API Node.js** roda localmente (via `npm run dev`)
- Ambos precisam estar rodando para o sistema funcionar!

## 🛠️ Comandos Úteis

### Gerenciar Containers

```bash
# Iniciar containers
docker-compose up -d

# Parar containers
docker-compose stop

# Parar e remover containers
docker-compose down

# Ver logs dos containers
docker-compose logs

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs db
docker-compose logs adminer

# Reiniciar containers
docker-compose restart

# Ver status dos containers
docker-compose ps
```

### Acessar o Banco de Dados

#### Via Adminer (Interface Web)
1. Acesse: http://localhost:8080
2. Preencha:
   - **Sistema**: PostgreSQL
   - **Servidor**: `db` (nome do serviço no docker-compose)
   - **Usuário**: `postgres` (ou o valor de `POSTGRES_USER`)
   - **Senha**: `postgres` (ou o valor de `POSTGRES_PASSWORD`)
   - **Banco de dados**: `pinheiro_society` (ou o valor de `POSTGRES_DB`)
3. Clique em **Entrar**

#### Via Prisma Studio
```bash
npm run prisma:studio
```
Acesse: http://localhost:5555

#### Via Terminal (PostgreSQL CLI)
```bash
# Acessar o container do PostgreSQL
docker exec -it pinheiro_society_db psql -U postgres -d pinheiro_society
```

### Limpar Dados

```bash
# Parar e remover containers + volumes (⚠️ APAGA TODOS OS DADOS)
docker-compose down -v

# Depois, iniciar novamente
docker-compose up -d
npx prisma migrate dev
```

## 🔧 Troubleshooting

### Problema: Porta já em uso

**Erro:** `Bind for 0.0.0.0:5344 failed: port is already allocated`

**Solução:** 
1. Verifique se há outro PostgreSQL rodando na porta 5344
2. Altere a porta no `docker-compose.yml`:
   ```yaml
   ports:
     - "5345:5432"  # Mude 5344 para outra porta
   ```
3. Atualize o `DATABASE_URL` no `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5345/pinheiro_society
   ```

### Problema: Container não inicia

**Erro:** Container fica em status "Restarting"

**Solução:**
```bash
# Ver logs para identificar o problema
docker-compose logs db

# Verificar se as variáveis de ambiente estão corretas
docker-compose config
```

### Problema: Prisma não conecta ao banco

**Erro:** `Can't reach database server`

**Soluções:**
1. Certifique-se de que o container está rodando:
   ```bash
   docker-compose ps
   ```

2. Verifique se a `DATABASE_URL` está correta:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5344/pinheiro_society
   ```
   - Use `localhost` (não `db`) quando conectar de fora do Docker
   - Use `db` apenas dentro do Docker Compose

3. Aguarde alguns segundos após iniciar o container (PostgreSQL pode levar alguns segundos para ficar pronto)

### Problema: Permissão negada no Windows

**Erro:** `Permission denied` ao executar docker-compose

**Solução:**
1. Execute o terminal como Administrador
2. Verifique se o Docker Desktop está rodando
3. Certifique-se de que o WSL2 está habilitado (Windows 10/11)

## 📝 Notas Importantes

### Windows
- ✅ **Docker Desktop** gerencia tudo automaticamente
- ✅ **Volumes nomeados** funcionam sem problemas
- ✅ **Portas mapeadas** funcionam normalmente
- ⚠️ Se usar **WSL2**, os caminhos podem ser diferentes, mas volumes nomeados resolvem isso

### Desenvolvimento
- A API roda **fora do Docker** (localmente com Node.js)
- Apenas o **PostgreSQL** roda no Docker
- Isso permite hot-reload e desenvolvimento mais rápido

### Produção
- Para produção, você pode criar um Dockerfile para a API também
- Por enquanto, apenas o banco está containerizado

## 🎯 Próximos Passos

Após seguir este guia, você terá:
- ✅ PostgreSQL rodando no Docker
- ✅ Adminer disponível para gerenciar o banco
- ✅ API rodando localmente
- ✅ Banco de dados configurado e migrado

Agora você pode:
1. Testar a API usando o Insomnia (coleção `insomnia_collection.json`)
2. Acessar a documentação Swagger em http://localhost:3000/api-docs
3. Gerenciar o banco via Adminer em http://localhost:8080

