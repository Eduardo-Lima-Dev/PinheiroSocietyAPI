-- Migration: Add Mesa table and mesaId field to Comanda
-- Created: 2024-10-27
-- Description: Add Mesa table for restaurant/bar management and link comandas to mesas

-- Create Mesa table
CREATE TABLE IF NOT EXISTS "Mesa" (
    "id" SERIAL PRIMARY KEY,
    "numero" INTEGER NOT NULL UNIQUE,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "clienteId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Mesa_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Add mesaId column to Comanda table
ALTER TABLE "Comanda" ADD COLUMN IF NOT EXISTS "mesaId" INTEGER;

-- Add foreign key constraint for mesaId
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'Comanda_mesaId_fkey'
    ) THEN
        ALTER TABLE "Comanda" 
        ADD CONSTRAINT "Comanda_mesaId_fkey" 
        FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Create index on mesaId for better query performance
CREATE INDEX IF NOT EXISTS "Comanda_mesaId_idx" ON "Comanda"("mesaId");

-- Create unique index on Mesa.numero (already exists as UNIQUE constraint, but adding index for performance)
CREATE INDEX IF NOT EXISTS "Mesa_numero_idx" ON "Mesa"("numero");

-- Add trigger to update Mesa.updatedAt on update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for Mesa table
DROP TRIGGER IF EXISTS update_mesa_updated_at ON "Mesa";
CREATE TRIGGER update_mesa_updated_at
    BEFORE UPDATE ON "Mesa"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
