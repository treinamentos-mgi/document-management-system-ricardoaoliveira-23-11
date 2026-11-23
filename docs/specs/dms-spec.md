# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, consultem e baixem documentos, mantendo os arquivos no filesystem local da aplicação e os metadados em memória nesta fase inicial.

## 2. Escopo

### Dentro do escopo

- Upload de documentos.
- Listagem dos documentos do usuário.
- Download de um documento pelo identificador.
- Associação de documentos a um proprietário.
- Exibição de estados de carregamento, sucesso e erro na interface.

### Fora do escopo

- Armazenamento em nuvem ou em serviços externos.
- Persistência durável dos metadados ou uso de banco de dados.
- Versionamento, edição, exclusão ou compartilhamento de documentos.
- Cadastro e autenticação de usuários nesta fase.
- Busca, categorias, pastas e pré-visualização do conteúdo.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar o envio de um arquivo por requisição. |
| RF-02 | O sistema deve rejeitar requisições sem arquivo e arquivos acima do limite configurado. |
| RF-03 | O sistema deve gravar o arquivo em diretório local usando `multer` com `diskStorage`. |
| RF-04 | O sistema deve gerar um identificador único e manter os metadados do documento em memória. |
| RF-05 | O sistema deve associar o documento ao proprietário identificado pelo contexto confiável do servidor, não por um campo livre enviado pelo cliente. |
| RF-06 | O usuário deve poder listar os metadados dos documentos associados ao seu proprietário. |
| RF-07 | O usuário deve poder baixar um documento pelo identificador, desde que pertença ao proprietário do contexto atual. |
| RF-08 | O download deve sugerir o nome original ao navegador, sem usar esse nome como caminho no filesystem. |
| RF-09 | O frontend deve apresentar erros da API sem interromper o uso da página. |
| RF-10 | O sistema deve refletir que os metadados existem somente durante a execução atual do backend; reiniciar o processo os remove. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser armazenados exclusivamente no filesystem local, em `backend/storage` por padrão. |
| RNF-02 | Uploads devem usar `multer` com `diskStorage`; não utilizar provedores externos. |
| RNF-03 | Os metadados devem ser mantidos em memória nesta fase. |
| RNF-04 | Configurações operacionais devem ser obtidas por variáveis de ambiente, com padrões documentados. |
| RNF-05 | O backend deve seguir o fluxo `routes -> controllers -> services -> repositories`. |
| RNF-06 | Camadas internas não devem depender de Express nem conhecer detalhes de transporte HTTP. |
| RNF-07 | O frontend deve usar React, componentes funcionais e `fetch` através do prefixo `/api`. |
| RNF-08 | Erros de validação, upload e leitura de arquivos devem ser tratados nos limites do sistema. |
| RNF-09 | Manter JavaScript, CommonJS no backend, ESM no frontend e testes backend com `node:test`. |
| RNF-10 | O sistema deve usar nomes internos gerados pelo servidor para evitar colisões e não confiar em nomes ou MIME types fornecidos pelo cliente. |

## 5. Modelo de dados

### Documento

| Campo | Tipo | Exposição | Descrição |
| --- | --- | --- | --- |
| `id` | string | Público | Identificador único, preferencialmente UUID. |
| `originalName` | string | Público | Nome original fornecido pelo cliente, tratado como dado não confiável. |
| `size` | number | Público | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Público | Data e hora do upload em ISO 8601. |
| `owner` | string | Público | Identificador do proprietário do documento. |
| `mimeType` | string | Público | Tipo MIME declarado no upload; não comprova o conteúdo real. |
| `storageName` | string | Interno | Nome gerado pelo servidor para localizar o arquivo no diretório local. |

O caminho físico pode ser mantido internamente pelo repositório, mas nunca retornado pela API. `storageName` deve ser gerado pelo servidor; `originalName` não deve ser usado para construir caminhos. O proprietário deve vir do contexto do servidor. Como autenticação está fora do escopo, a execução local pode usar um proprietário padrão configurado por `DMS_DEFAULT_OWNER_ID`.

## 6. Contratos de API

As rotas Express são `/upload`, `/documents` e `/documents/:id/download`. No desenvolvimento, o frontend usa o prefixo `/api`, removido pelo proxy do Vite antes de encaminhar a chamada ao backend.

Formato padrão de erro:

```json
{
  "error": {
    "code": "FILE_REQUIRED",
    "message": "Selecione um arquivo para enviar."
  }
}
```

### `POST /upload`

- Entrada: `multipart/form-data` com o campo obrigatório `file` e um único arquivo.
- O proprietário é determinado pelo contexto confiável do servidor; não aceitar `owner` do cliente como fonte de autorização.
- Sucesso: `201 Created`, corpo JSON com os metadados públicos do documento.
- Erros: `400 Bad Request` para arquivo ausente ou requisição inválida; `413 Payload Too Large` para limite excedido; `500 Internal Server Error` para falhas inesperadas de armazenamento.
- Se a gravação do arquivo ocorrer e o registro de metadados falhar, o serviço deve tentar remover o arquivo recém-gravado.

Exemplo de resposta:

```json
{
  "id": "uuid",
  "originalName": "relatorio.pdf",
  "size": 153600,
  "uploadedAt": "2026-11-23T12:00:00.000Z",
  "owner": "default",
  "mimeType": "application/pdf"
}
```

### `GET /documents`

- Entrada: sem corpo.
- Retorna apenas os documentos do proprietário do contexto atual, em ordem decrescente de `uploadedAt`.
- Sucesso: `200 OK`, corpo JSON como array; array vazio quando não houver documentos.

```json
[
  {
    "id": "uuid",
    "originalName": "relatorio.pdf",
    "size": 153600,
    "uploadedAt": "2026-11-23T12:00:00.000Z",
    "owner": "default",
    "mimeType": "application/pdf"
  }
]
```

### `GET /documents/:id/download`

- Entrada: identificador do documento no caminho; sem corpo.
- Retorna o conteúdo binário somente se o documento pertencer ao proprietário do contexto atual.
- Sucesso: `200 OK`, `Content-Type` compatível quando conhecido e `Content-Disposition: attachment` com o nome original devidamente tratado.
- Erros: `404 Not Found` para documento inexistente, não pertencente ao proprietário ou arquivo ausente; `500 Internal Server Error` para falha inesperada de leitura.
- A resposta não deve revelar caminhos locais nem confirmar a existência de documentos de outros proprietários.

## 7. Decisões arquiteturais

- `routes/`: registra endpoints e delega aos controllers.
- `controllers/`: trata entrada e saída HTTP, valida parâmetros e converte erros para respostas HTTP.
- `services/`: concentra regras de negócio e coordena as operações dos repositórios.
- `repositories/`: grava e localiza arquivos no filesystem local e mantém metadados em memória.
- `multer` com `diskStorage` fica na fronteira HTTP; regras de negócio não devem depender de tipos específicos do Multer.
- O frontend organiza a interface em componentes e páginas, concentrando chamadas à API em `frontend/src/services/`.
- O proxy Vite encaminha `/api` ao backend local; as rotas Express não incluem o prefixo `/api`.
- Diretório, limite de upload, porta e proprietário padrão são configurações de ambiente.

| Variável | Padrão | Finalidade |
| --- | --- | --- |
| `PORT` | `3000` | Porta do backend. |
| `STORAGE_DIR` | `backend/storage` | Diretório local de arquivos. |
| `MAX_UPLOAD_SIZE_BYTES` | `10485760` | Limite inicial de 10 MiB por arquivo. |
| `DMS_DEFAULT_OWNER_ID` | `default` | Proprietário no modo local sem autenticação. |

## 8. Plano de execução

As etapas abaixo descrevem implementação futura. Nesta tarefa, deve ser criado somente este documento; não implementar nem alterar arquivos de backend ou frontend.

| Etapa | Arquivos previstos para implementação futura | Critérios de aceite |
| --- | --- | --- |
| 1. Especificação | `docs/specs/dms-spec.md` | Documento contém escopo, requisitos, modelo de dados, contratos, decisões e etapas. Esta é a única etapa executada nesta solicitação. |
| 2. Persistência local e regras de negócio | Futuros arquivos em `backend/src/repositories/` e `backend/src/services/` | Upload grava localmente; metadados ficam em memória; proprietário é aplicado pelo servidor; falhas de registro tentam compensar removendo o arquivo criado. |
| 3. API e validação | Futuros arquivos em `backend/src/routes/`, `backend/src/controllers/` e integração em `backend/src/app.js` | Endpoints implementam os contratos, limitam uploads, isolam documentos por proprietário e retornam erros consistentes. |
| 4. Testes do backend | `backend/test/app.test.js` e, se necessário, novos testes em `backend/test/` | Cobertura de upload válido e inválido, listagem, download, isolamento por proprietário e falhas principais usando `node:test`. |
| 5. Interface e integração | Futuros arquivos em `frontend/src/components/`, `frontend/src/pages/`, `frontend/src/services/` e `frontend/src/App.jsx` | Usuário consegue enviar, listar e baixar documentos; estados de carregamento e erro são apresentados; chamadas usam `/api`. |
| 6. Verificação integrada | Scripts existentes de backend e frontend | `npm test` no backend e `npm run build` no frontend passam; fluxo integrado funciona com backend e Vite locais. |

## 9. Riscos e pontos de atenção

- Metadados em memória são perdidos ao reiniciar o backend; arquivos locais podem permanecer sem referência. Isso é uma limitação aceita nesta fase.
- Sem autenticação, o proprietário padrão atende somente ao modo local de usuário único. Uso multiusuário exige uma fonte confiável de identidade antes da implantação.
- Nome e MIME type fornecidos pelo cliente não são confiáveis. Usar nome interno gerado e não tratar o MIME declarado como validação do conteúdo.
- O limite proposto de 10 MiB é um padrão inicial configurável e deve ser confirmado antes da implementação.
- O processo precisa de permissão de escrita e espaço disponível no diretório de armazenamento local.
