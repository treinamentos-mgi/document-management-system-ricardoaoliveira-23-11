---
description: "Cria um novo endpoint REST completo (rota, controller, service, validação e testes) seguindo os padrões do projeto"
agent: agent
---

# Criar novo endpoint REST

Você vai criar um endpoint REST completo para o recurso **${input:recurso:nome do recurso, ex.: documento, categoria}**,
com a operação **${input:operacao:ex.: listar, buscar por id, criar, atualizar, excluir}**.

## Antes de escrever código
1. Analise a estrutura do projeto (`package.json`, pasta `src/`) e identifique:
   - framework HTTP (Express, Fastify, NestJS...)
   - padrão de camadas (routes → controllers → services → repositories)
   - biblioteca de validação (Joi, Zod, express-validator...)
   - framework de testes (Jest, Vitest, Mocha...)
2. Use um endpoint existente como referência e **siga exatamente o mesmo padrão**.
   Não introduza bibliotecas novas.

## O que gerar
- **Rota**: registre o endpoint no arquivo de rotas do recurso, usando verbo HTTP e path RESTful.
- **Controller**: só trata a requisição e a resposta, sem regra de negócio.
- **Service**: regra de negócio e chamadas ao repositório/banco.
- **Validação**: valide `params`, `query` e `body` com a biblioteca já usada no projeto.
- **Tratamento de erros**: use o middleware/padrão de erro existente, com os status HTTP corretos
  (400 validação, 404 não encontrado, 409 conflito, 500 erro interno).
- **Testes**: crie testes cobrindo o caminho feliz, a validação inválida e o recurso inexistente.

## Regras
- Use `async/await` e não deixe Promises sem tratamento.
- Não exponha stack trace nem dados sensíveis nas respostas.
- Nomes de variáveis e funções em inglês; mensagens ao usuário em português.
- Se o recurso lidar com arquivos (upload de documentos), valide tipo MIME e tamanho máximo.

## Ao terminar
1. Rode os testes (`npm test`) e corrija as falhas.
2. Liste os arquivos criados ou alterados e mostre um exemplo de requisição `curl` para o endpoint.