-- Nota interna do pedido (visível apenas no painel)
ALTER TABLE `Order` ADD COLUMN `internalNote` TEXT NULL;
