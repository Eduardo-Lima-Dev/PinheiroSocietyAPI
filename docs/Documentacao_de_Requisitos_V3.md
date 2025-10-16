# UNIVERSIDADE FEDERAL DO CEARÁ
## CAMPUS QUIXADÁ

# Documentação de Requisitos

## Equipe
- João Gabriel Costa Leandro - 569466
- Kawan Torres Lopes - 563869
- Luiz Eduardo Paiva Ribeiro - 516384
- Luiz Eduardo Borges de Lima - 500623
- Rafael Sousa Cabral - 542172

---

## ÍNDICE
1. [Introdução](#1-introdução)
2. [Coleta de Requisitos](#2-coleta-de-requisitos)
   - 2.1. [Perfis Identificados](#21-perfis-identificados)
3. [Regras de Negócio](#3-regras-de-negócio)
4. [Requisitos Funcionais](#4-requisitos-funcionais)
5. [Requisitos Não Funcionais](#5-requisitos-não-funcionais)
   - 5.1. [Usabilidade](#51-usabilidade)
   - 5.2. [Desempenho](#52-desempenho)
   - 5.3. [Segurança](#53-segurança)
   - 5.4. [Confiabilidade](#54-confiabilidade)

---

## 1. Introdução

O presente documento reúne regras de negócio, requisitos funcionais e não funcionais presentes para o desenvolvimento do Sistema de Gestão - Pinheiro Society. Apresentando a metodologia de coleta de dados adotada, regras de negócios, requisitos extraídos da coleta, apresentando o detalhamento, a prioridade de cada requisito, e histórias de usuário para os principais requisitos da aplicação.

## 2. Coleta de Requisitos

Na etapa de coleta dos requisitos e identificação das regras de negócios, foram usados as metodologias de entrevistas e brainstorm. Possuindo contato direto com o stakeholder, pela flexibilidade e melhor compreensão das necessidades e desafios do cliente, ambos os métodos foram escolhidos.

### 2.1. Perfis Identificados

Após a aplicação dos métodos de coleta de dados, foi possível identificarmos os perfis de usuários do sistema.

- **Usuário de nível funcionário:** Este potencial usuário, possui acesso a funcionalidades referente ao seu nível de acesso. Não possui acesso a funcionalidades que dizem respeito ao controle monetário ou de produtos.

- **Usuário de nível administrador:** Este potencial usuário, possui acesso livre a todas as funcionalidades sistema. Além de possuir acesso restrito ao controle financeiro e de estoque.

## 3. Regras de Negócio

**RN-01:** Cadastro de reserva deve possuir, nome do cliente, data, horário e campo reservado.

**RN-02:** O cancelamento de um horário com estorno do valor pago só pode ser realizado até um prazo estipulado 24 horas antes do horário da reserva. Após esse período não haverá reembolso.

**RN-03:** Ao efetuar a reserva, deve ser pago 50% (pagando o restante posteriormente) ou 100% do valor total de horas. A reserva só é confirmada após o pagamento.

**RN-04:** As reservas são realizadas através de meios de contato (whatsapp e instagram) ou pessoalmente e cadastradas no sistema pelo funcionário ou administrador.

**RN-05:** O valor da hora varia conforme o horário(diurno ou noturno), sendo 100 reais até às 17 horas, a partir das 17 horas até às 23 horas o preço sobe para 110 reais. Não há alterações de preço em feriados ou finais de semana.

**RN-06:** O sistema deve permitir que o Administrador proporcione exceções nas regras de cancelamento, autorizando estorno mesmo fora do prazo padrão. Em casos de cancelamento com motivo justificável (ex.: falecimento de parente do cliente), o reembolso deve ser realizado mesmo se alertado após o horário limite.

**RN-07:** Reservas feitas para horários diurnos devem ser feitas com até 1hora de antecedência.

**RN-08:** O cadastro do cliente deve possuir nome, CPF, email e telefone, e tipo (para identificar se é cliente fixo ou visitante).

**RN-09:** Cada reserva deve ser atrelada a uma quadra.

**RN-10:** Cada campo deve ser identificado por uma numeração (ex.: campo 01).

**RN-11:** Clientes fixos possuem as reservas semanais. As reservas de clientes fixos devem ser renovadas automaticamente mantendo horário e campo os mesmos, alterando apenas o dia.

**RN-12:** O estoque deve conter um número mínimo de cada bebida e alimento, sendo alertado automaticamente caso chegue no limite.

**RN-13:** O sistema deve aceitar como forma de pagamento Pix, dinheiro e cartão de crédito e débito.

**RN-14:** Em caso de não comparecimento, o cliente não perderá o horário da reserva, pois já pagou com antecedência.

**RN-15:** O sistema do bar e de agendamento não devem estar diretamente associados (associar comandas à determinado campo).

**RN-16:** A comanda do bar deve ser associada a um cliente/mesa.

**RN-17:** Em caso de reagendamento, o cliente deverá informar em até 24 horas antes do horário de sua reserva.

**RN-018:** Acréscimos de horários de reserva durante o horário da reserva, deve ser realizado em frações de 30 minutos, caso o campo esteja livre, e acrescentado um 50% do valor de uma hora da reserva.

**RN-019:** O valor da reserva (100 reais no período diurno e 110 no período noturno) é referente apenas à 1 hora.

## 4. Requisitos Funcionais

### RF-01: Cadastrar Clientes

**Descrição:** O sistema deve permitir que o usuário realize o cadastro clientes no banco de dados. Cada cliente deve possuir informações essenciais como nome*, CPF* no formato (XXX.XXX.XXX-XX), e-mail*, telefone*, tipo*.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

**História de Usuário:** Como Funcionário, quero cadastrar um novo cliente de forma rápida e eficiente, para que eu possa agilizar o processo de uma nova reserva e manter um histórico organizado para futuras interações.

**Critérios de Aceite:**
- O formulário de cadastro deve solicitar os campos obrigatórios: Nome, CPF, E-mail, Telefone e Tipo de Cliente (Fixo ou Visitante), conforme a regra de negócio RN-08.
- O sistema deve validar o formato do CPF (XXX.XXX.XXX-XX) para garantir a integridade dos dados.
- O sistema não deve permitir o cadastro de um novo cliente com um CPF já existente no banco de dados.
- Ao final do cadastro, uma mensagem de sucesso ("Cliente cadastrado com sucesso!") deve ser exibida.
- Caso ocorra um erro de validação, o sistema deve indicar claramente quais campos precisam ser corrigidos.

### RF-02: Editar Cadastro de Clientes

**Descrição:** O sistema deve permitir que o usuário realize alterações nos dados cadastrados de um cliente.

**Priorização:** Alta ☐ | Média ☑ | Baixa ☐

### RF-03: Excluir Cadastro de Clientes

**Descrição:** O sistema deve permitir que o usuário possa excluir o cadastro de um cliente, desde que seja solicitado pelo próprio cliente.

**Priorização:** Alta ☐ | Média ☐ | Baixa ☑

### RF-04: Realizar Reserva

**Descrição:** O sistema deve permitir que o usuário realize o cadastro da reserva de horário do banco de dados. A reserva só será confirmada após o pagamento, como indicado nas regras de negócios RN-03.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

**História de Usuário:** Como Funcionário, quero realizar um novo agendamento em poucos cliques diretamente na grade de horários, para que o atendimento presencial ou por telefone não seja atrasado.

**Critérios de Aceite:**
- Ao clicar em um horário disponível, o sistema deve abrir uma tela para criação da reserva.
- Nesta tela, deve ser possível buscar um cliente já existente (por nome ou CPF) ou cadastrar um novo cliente rapidamente.
- O sistema deve reter o horário como "pré-reservado" por 20 minutos enquanto o pagamento é aguardado, impedindo que outro usuário o selecione.
- A reserva só é confirmada após o registro do pagamento.
- O sistema deve impedir reservas duplicadas para o mesmo campo e horário.

### RF-05: Cancelar Reservas

**Descrição:** O sistema deve permitir o usuário efetuar o cancelamento da reserva do cliente, seguindo restrições de reembolso presentes na RN-02.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

**História de Usuário:** Como Funcionário, quero cancelar uma reserva existente no sistema, para que o horário seja liberado para outros clientes e as políticas de reembolso sejam aplicadas corretamente.

**Critérios de Aceite:**
- O sistema deve permitir buscar a reserva a ser cancelada (pelo nome do cliente, data ou quadra).
- Ao selecionar "cancelar", o sistema deve informar se o cliente tem direito ao estorno do valor pago, com base na regra de negócio RN-02 (cancelamento com 24 horas de antecedência).
- O administrador deve ter a permissão de autorizar um estorno mesmo fora do prazo, em casos excepcionais (RN-06).
- Após o cancelamento, o horário deve voltar a ficar disponível na grade de horários.

### RF-06: Reagendamento de Reservas

**Descrição:** O sistema deve permitir o reagendamento de reservas previamente cadastradas, possibilitando alterar o horário e/ou campo da reserva, desde que o novo horário esteja disponível. O reagendamento deve respeitar as regras de negócio vigentes, como prazos mínimos e políticas de cancelamento.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

### RF-07: Realizar Login

**Descrição:** O sistema deve autenticar os usuários (administrador e funcionário) através de CPF e senha, definindo permissões conforme o nível de acesso.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

**História de Usuário:** Como Administrador, eu quero que o sistema exija autenticação por CPF e senha para todos os usuários, para que as funcionalidades críticas, como financeiro e configurações, fiquem protegidas e acessíveis apenas a quem tem permissão.

**Critérios de Aceite:**
- O sistema deve ter uma tela de login que solicite CPF e senha (RF-07).
- As senhas devem ser armazenadas de forma criptografada no banco de dados (RNF-02 de Segurança).
- Usuários com perfil Funcionário não devem ter acesso a funcionalidades de configuração, relatórios financeiros ou gestão de estoque (RNF-01 de Segurança).
- Usuários com perfil Administrador devem ter acesso total a todas as funcionalidades do sistema.

### RF-08: Realizar Busca

**Descrição:** O sistema deve permitir que o usuário realize busca de clientes, buscando pelo dados do cliente (CPF ou nome), e de reservas, buscando pelos dados da reserva (horário, data, campo e cliente).

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

### RF-09: Gerar Registro de Pagamento

**Descrição:** O sistema deve permitir o registro detalhado de todos os pagamentos realizados pelos clientes no momento da reserva. Cada pagamento deve ser vinculado à respectiva reserva ou comanda, armazenando informações como valor total, forma de pagamento e status de reserva (paga parcialmente ou totalmente).

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

**História de Usuário:** Como um Funcionário, eu quero registrar o pagamento de uma reserva no momento do agendamento, para que a reserva seja oficialmente confirmada no sistema e o controle financeiro seja mantido preciso.

**Critérios de Aceite:**
- O sistema deve permitir o registro de pagamento parcial (50%) ou total (100%), conforme a regra RN-03.
- As formas de pagamento aceitas devem ser Pix, dinheiro, e cartão de crédito/débito (RN-13).
- Após o registro do pagamento, o status da reserva deve mudar de "Pré-reserva" para "Confirmada".
- O sistema deve gerar um comprovante de pagamento que possa ser impresso ou enviado ao cliente.

### RF-10: Gerar Relatórios Administrativos

**Descrição:** O sistema deve permitir gerar relatórios administrativos que consolida informações financeiras, reservas realizadas, consumo de produtos no bar e controle de estoque.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

**História de Usuário:** Como Administrador, eu quero gerar relatórios consolidados sobre as operações, para que eu possa analisar o desempenho financeiro, a ocupação das quadras e as vendas do bar para tomar decisões estratégicas.

**Critérios de Aceite:**
- O acesso a esta funcionalidade deve ser restrito ao perfil de Administrador.
- Deve ser possível gerar relatórios financeiros filtrando por período (diário, semanal, mensal).
- Deve ser possível gerar um relatório de ocupação por quadra para identificar os horários de maior demanda.
- Os relatórios devem poder ser exportados em formato PDF ou planilha.

### RF-11: Vincular Comanda

**Descrição:** O sistema deve permitir o registro de comandas de bar, vinculando-as a um cliente ou mesa específica, sem depender de uma reserva de campo.

**Priorização:** Alta ☐ | Média ☑ | Baixa ☐

### RF-12: Histórico de Agendamentos por Cliente

**Descrição:** O sistema deve armazenar e exibir o histórico de reservas de cada cliente cadastrado, permitindo consultas por período.

**Priorização:** Alta ☐ | Média ☑ | Baixa ☐

### RF-13: Registrar Movimentação de Estoque

**Descrição:** O sistema deve permitir o controle de entradas e saídas de produtos do estoque, com registro de movimentações manuais e automáticas (via comandas).

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

### RF-14: Cadastro de Produtos no Cardápio

**Descrição:** O sistema deve permitir que o usuário (com nível de administrador), realize o cadastro de produtos disponíveis para venda na área do bar. O cadastro deve incluir nome* e preço* do produto.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

### RF-15: Editar Produtos Cadastrados

**Descrição:** O sistema deve permitir que o usuário (com nível de administrador), possa alterar os dados (nome e preço) de um produto cadastrado.

**Priorização:** Alta ☐ | Média ☑ | Baixa ☐

### RF-16: Excluir Produtos Cadastrados

**Descrição:** O sistema deve permitir que o usuário (com nível de administrador), possa excluir produtos presentes no sistema.

**Priorização:** Alta ☐ | Média ☐ | Baixa ☑

### RF-17: Cadastro de Produtos no Estoque

**Descrição:** O sistema deve permitir que o usuário (com nível de administrador), cadastre produtos armazenados no estoque, solicitando nome, quantidade e validade dos produtos.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

### RF-18: Definir Quantia Mínima no Estoque

**Descrição:** O sistema deve permitir que o usuário (com nível de administrador), possa cadastrar a quantidade mínima de cada produto no estoque.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

### RF-19: Cadastrar Campo

**Descrição:** O sistema deve permitir que o usuário (com nível de administrador), adicione uma nova quadra cadastrando com seu número de identificação como indicado em RN-10.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

## 5. Requisitos Não Funcionais

### 5.1. Usabilidade

#### RNF-01: Interface Intuitiva

**Descrição:** A interface deve ser intuitiva e clara, focada na agilidade para realizar um agendamento presencial e demais operações do dia a dia.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

#### RNF-02: Feedback Visual das Ações

**Descrição:** O sistema deve apresentar feedback visual como mensagens de sucesso ou de erro em todas as operações realizadas.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

#### RNF-03: Padronização Visual

**Descrição:** O sistema deve utilizar cores e ícones padronizados para facilitar a identificação de funcionalidades.

**Priorização:** Alta ☐ | Média ☑ | Baixa ☐

#### RNF-04: Busca Rápida

**Descrição:** O sistema deve permitir busca rápida por clientes e reservas através de um campo de pesquisa.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

#### RNF-05: Grade de Horários

**Descrição:** O sistema deve possuir na uma tela com todos os horários do dia, identificando quais estão reservados, indicando o campo, e quais estão livres para reservas.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

**História de Usuário:** Como Funcionário, quero visualizar a grade de horários de todas as quadras de forma clara e intuitiva, para que eu possa identificar rapidamente os horários disponíveis e informar ao cliente com agilidade.

**Critérios de Aceite:**
- A tela deve exibir uma visão semanal ou diária das quadras.
- Cada quadra deve ser claramente identificada (ex: Campo 01, Campo 02).
- Os horários ocupados devem ser visualmente distintos dos horários livres (ex: cores diferentes).
- Ao passar o mouse sobre um horário ocupado, o sistema deve exibir um resumo da reserva (nome do cliente).

### 5.2. Desempenho

#### RNF-01: Acréscimo Flexível de Tempo

**Descrição:** O sistema deve permitir que o Administrador faça um acréscimo de tempo nas reservas em frações de 30 minutos. Cada acréscimo corresponde a um adicional de 50% do valor da hora.

**Priorização:** Alta ☐ | Média ☑ | Baixa ☐

#### RNF-02: Tempo de Processamento

**Descrição:** O sistema deve processar reservas e cadastros em menos de 5 segundos.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

#### RNF-03: Suporte e Acessos Simultâneos

**Descrição:** O sistema deve suportar até 3 usuários conectados simultaneamente sem perda de desempenho.

**Priorização:** Alta ☐ | Média ☑ | Baixa ☐

#### RNF-04: Otimização de Consultas

**Descrição:** O sistema deve otimizar consultas no histórico de reservas, retornando resultados em até 5 segundos.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

#### RNF-05: Agendamento de Clientes Fixos

**Descrição:** O sistema deve agendar automaticamente a reserva de clientes do tipo fixo.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

**História de Usuário:** Como Administrador, eu quero configurar reservas semanais recorrentes para clientes classificados como "fixos", para que o horário seja garantido para esses clientes, aumentando a fidelização e automatizando o processo de agendamento.

**Critérios de Aceite:**
- No cadastro do cliente, deve ser possível marcá-lo como "Fixo".
- Para um cliente fixo, o sistema deve permitir criar uma reserva que se repete automaticamente toda semana, no mesmo campo e horário, conforme a regra RN-11.
- O sistema deve impedir que outros clientes reservem esse horário recorrente, tratando-o como bloqueado permanentemente na grade.

#### RNF-06: Impedir Choque de Reservas

**Descrição:** O sistema deve impedir que mais de uma reserva seja feita no mesmo dia, horário e campo.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

#### RNF-07: Tempo de Pré-reserva

**Descrição:** O sistema deve reter um horário como "pré-reserva" por um tempo de 20 minutos para aguardar o pagamento, liberando o horário automaticamente caso o pagamento não seja confirmado.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

#### RNF-08: Baixa no Estoque

**Descrição:** O sistema deve permitir baixa automática no estoque a cada venda realizada.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

### 5.3. Segurança

#### RNF-01: Restrição de Acesso Por Perfil

**Descrição:** O acesso a dados financeiros e de configuração deve ser restrito ao perfil de Administrador.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

#### RNF-02: Criptografia de Senhas

**Descrição:** As senhas de usuários devem ser armazenadas de forma criptografada.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

#### RNF-03: Alerta de Estoque Mínimo

**Descrição:** O sistema deve emitir um aviso quando qualquer alimento ou bebida no estoque atingir seu limite mínimo.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

#### RNF-04: Backup Automático

**Descrição:** O sistema deve realizar backup automático dos dados a cada 24 horas.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

#### RNF-05: Autenticação para Ações Críticas

**Descrição:** Toda operação crítica (ex.: alteração de preços) deve exigir autenticação do administrador.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

#### RNF-06: Níveis de Acesso Detalhados

**Descrição:** O sistema deve possuir dois níveis de acesso (ex: Administrador que deve possuir acesso direto aos dados financeiro e Funcionário que pode cadastrar reservas e comandas, mas não pode alterar preços, excluir registros financeiros).

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

#### RNF-07: Credenciais de Login Seguras

**Descrição:** Os cadastros de níveis de operador (Administrador, Funcionário, etc.) devem possuir uma senha e CPF para realizar login.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

### 5.4. Confiabilidade

#### RNF-01: Geração de relatórios de estoque

**Descrição:** Relatórios de estoque devem ser gerados automaticamente a cada 5 dias, mas também sob demanda pelo administrador.

**Priorização:** Alta ☐ | Média ☑ | Baixa ☐

#### RNF-02: Prevenção de reservas duplicadas

**Descrição:** O sistema deve garantir que não ocorram reservas duplicadas para o mesmo campo e horário.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

#### RNF-03: Integridade dos dados

**Descrição:** O sistema deve manter a integridade dos dados mesmo em caso de falha elétrica ou encerramento abrupto.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐

#### RNF-04: Disponibilidade do sistema

**Descrição:** O sistema deve manter disponibilidade mínima de 99% durante o horário de funcionamento.

**Priorização:** Alta ☑ | Média ☐ | Baixa ☐