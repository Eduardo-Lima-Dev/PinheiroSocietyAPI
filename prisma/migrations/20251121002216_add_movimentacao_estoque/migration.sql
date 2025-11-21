-- CreateEnum
CREATE TYPE "public"."MovimentacaoTipo" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateTable
CREATE TABLE "public"."MovimentacaoEstoque" (
    "id" SERIAL NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "tipo" "public"."MovimentacaoTipo" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "quantidadeAntes" INTEGER NOT NULL,
    "quantidadeDepois" INTEGER NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimentacaoEstoque_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."MovimentacaoEstoque" ADD CONSTRAINT "MovimentacaoEstoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "public"."Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
