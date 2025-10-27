/*
  Warnings:

  - You are about to drop the column `customerName` on the `Comanda` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Comanda` table. All the data in the column will be lost.
  - You are about to drop the `Racha` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
DO $$ BEGIN
 CREATE TYPE "public"."ReservaStatus" AS ENUM ('ATIVA', 'CANCELADA', 'CONCLUIDA');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- DropForeignKey
ALTER TABLE "public"."Comanda" DROP CONSTRAINT "Comanda_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Comanda" DROP COLUMN "customerName",
DROP COLUMN "userId",
ADD COLUMN     "clienteId" INTEGER;

-- DropTable
DROP TABLE "public"."Racha";

-- CreateTable
CREATE TABLE "public"."Cliente" (
    "id" SERIAL NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Quadra" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quadra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reserva" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "quadraId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "hora" INTEGER NOT NULL,
    "precoCents" INTEGER NOT NULL,
    "status" "public"."ReservaStatus" NOT NULL DEFAULT 'ATIVA',
    "observacoes" TEXT,
    "recorrente" BOOLEAN NOT NULL DEFAULT false,
    "diaSemana" INTEGER,
    "dataFimRecorrencia" TIMESTAMP(3),
    "reservaPaiId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lancamento" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER,
    "nomeCliente" TEXT,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "payment" "public"."PaymentMethod" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lancamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LancamentoItem" (
    "id" SERIAL NOT NULL,
    "lancamentoId" INTEGER NOT NULL,
    "produtoId" INTEGER,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LancamentoItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_cpf_key" ON "public"."Cliente"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_email_key" ON "public"."Cliente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Quadra_nome_key" ON "public"."Quadra"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Reserva_data_hora_quadraId_key" ON "public"."Reserva"("data", "hora", "quadraId");

-- AddForeignKey
ALTER TABLE "public"."Reserva" ADD CONSTRAINT "Reserva_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reserva" ADD CONSTRAINT "Reserva_quadraId_fkey" FOREIGN KEY ("quadraId") REFERENCES "public"."Quadra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reserva" ADD CONSTRAINT "Reserva_reservaPaiId_fkey" FOREIGN KEY ("reservaPaiId") REFERENCES "public"."Reserva"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comanda" ADD CONSTRAINT "Comanda_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lancamento" ADD CONSTRAINT "Lancamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LancamentoItem" ADD CONSTRAINT "LancamentoItem_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "public"."Lancamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LancamentoItem" ADD CONSTRAINT "LancamentoItem_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "public"."Produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
