CREATE TABLE `clientProducts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`productId` int NOT NULL,
	`monthlyVolumeKg` decimal(10,2) NOT NULL,
	`sellingPriceSgdPerKg` decimal(10,2) NOT NULL,
	`specialDiscount` decimal(5,2) NOT NULL DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientProducts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`businessType` varchar(100),
	`contactPerson` varchar(255),
	`contactEmail` varchar(320),
	`contactPhone` varchar(50),
	`address` text,
	`discountPercent` decimal(5,2) NOT NULL DEFAULT '0',
	`paymentTerms` varchar(100),
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exchangeRates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` timestamp NOT NULL,
	`jpyToSgdRate` decimal(10,4) NOT NULL,
	`source` varchar(100) NOT NULL DEFAULT 'manual',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exchangeRates_id` PRIMARY KEY(`id`),
	CONSTRAINT `exchangeRates_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`quantityKg` decimal(10,2) NOT NULL DEFAULT '0',
	`allocatedKg` decimal(10,2) NOT NULL DEFAULT '0',
	`reorderPointKg` decimal(10,2) NOT NULL DEFAULT '10',
	`warehouseLocation` varchar(100),
	`lastOrderDate` timestamp,
	`lastArrivalDate` timestamp,
	`nextOrderDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_productId_unique` UNIQUE(`productId`)
);
--> statement-breakpoint
CREATE TABLE `inventorySnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`snapshotName` varchar(255) NOT NULL,
	`snapshotData` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventorySnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matchaProducts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`grade` enum('competition','ceremonial','premium','cafe','culinary') NOT NULL,
	`costYenPerKg` decimal(10,2) NOT NULL,
	`qualityScore` int NOT NULL DEFAULT 5,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matchaProducts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderType` enum('supplier_order','client_delivery') NOT NULL,
	`supplierId` int,
	`clientId` int,
	`productId` int NOT NULL,
	`quantityKg` decimal(10,2) NOT NULL,
	`status` enum('pending','confirmed','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`orderDate` timestamp NOT NULL DEFAULT (now()),
	`expectedDeliveryDate` timestamp,
	`actualDeliveryDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`currentProductId` int NOT NULL,
	`recommendedProductId` int NOT NULL,
	`reason` text NOT NULL,
	`currentProfitPerKg` decimal(10,2) NOT NULL,
	`recommendedProfitPerKg` decimal(10,2) NOT NULL,
	`profitIncreaseSgd` decimal(10,2) NOT NULL,
	`profitIncreasePercent` decimal(5,2) NOT NULL,
	`status` enum('pending','accepted','rejected','implemented') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reorderAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`supplierId` int NOT NULL,
	`currentStockKg` decimal(10,2) NOT NULL,
	`reorderPointKg` decimal(10,2) NOT NULL,
	`recommendedOrderKg` decimal(10,2) NOT NULL,
	`urgencyLevel` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`reason` text NOT NULL,
	`status` enum('active','ordered','dismissed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reorderAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`country` varchar(100) NOT NULL DEFAULT 'Japan',
	`contactPerson` varchar(255),
	`contactEmail` varchar(320),
	`contactPhone` varchar(50),
	`leadTimeDays` int NOT NULL DEFAULT 45,
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`clientId` int NOT NULL,
	`productId` int NOT NULL,
	`quantityKg` decimal(10,2) NOT NULL,
	`costYenPerKg` decimal(10,2) NOT NULL,
	`exchangeRate` decimal(10,4) NOT NULL,
	`shippingCostSgdPerKg` decimal(10,2) NOT NULL DEFAULT '15',
	`importTaxPercent` decimal(5,2) NOT NULL DEFAULT '9',
	`totalCostSgdPerKg` decimal(10,2) NOT NULL,
	`sellingPriceSgdPerKg` decimal(10,2) NOT NULL,
	`discountSgdPerKg` decimal(10,2) NOT NULL DEFAULT '0',
	`profitSgdPerKg` decimal(10,2) NOT NULL,
	`totalProfitSgd` decimal(10,2) NOT NULL,
	`transactionDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `client_idx` ON `clientProducts` (`clientId`);--> statement-breakpoint
CREATE INDEX `product_idx` ON `clientProducts` (`productId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `exchangeRates` (`date`);--> statement-breakpoint
CREATE INDEX `product_idx` ON `inventory` (`productId`);--> statement-breakpoint
CREATE INDEX `created_by_idx` ON `inventorySnapshots` (`createdBy`);--> statement-breakpoint
CREATE INDEX `supplier_idx` ON `matchaProducts` (`supplierId`);--> statement-breakpoint
CREATE INDEX `supplier_idx` ON `orders` (`supplierId`);--> statement-breakpoint
CREATE INDEX `client_idx` ON `orders` (`clientId`);--> statement-breakpoint
CREATE INDEX `product_idx` ON `orders` (`productId`);--> statement-breakpoint
CREATE INDEX `client_idx` ON `recommendations` (`clientId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `recommendations` (`status`);--> statement-breakpoint
CREATE INDEX `product_idx` ON `reorderAlerts` (`productId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `reorderAlerts` (`status`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `transactions` (`orderId`);--> statement-breakpoint
CREATE INDEX `client_idx` ON `transactions` (`clientId`);--> statement-breakpoint
CREATE INDEX `product_idx` ON `transactions` (`productId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `transactions` (`transactionDate`);