-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "Tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureTierConfig" (
    "id" TEXT NOT NULL,
    "availability" TEXT NOT NULL,
    "pricingModel" TEXT,
    "price" INTEGER,
    "featureId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,

    CONSTRAINT "FeatureTierConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customerName" TEXT,
    "seats" INTEGER NOT NULL,
    "termLength" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productName" TEXT NOT NULL,
    "tierName" TEXT NOT NULL,
    "basePricePerSeat" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteAddOn" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "featureName" TEXT NOT NULL,
    "pricingModel" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quoteId" TEXT NOT NULL,
    "featureTierConfigId" TEXT NOT NULL,

    CONSTRAINT "QuoteAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tier_productId_idx" ON "Tier"("productId");

-- CreateIndex
CREATE INDEX "Feature_productId_idx" ON "Feature"("productId");

-- CreateIndex
CREATE INDEX "FeatureTierConfig_featureId_idx" ON "FeatureTierConfig"("featureId");

-- CreateIndex
CREATE INDEX "FeatureTierConfig_tierId_idx" ON "FeatureTierConfig"("tierId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureTierConfig_featureId_tierId_key" ON "FeatureTierConfig"("featureId", "tierId");

-- CreateIndex
CREATE INDEX "Quote_productId_idx" ON "Quote"("productId");

-- CreateIndex
CREATE INDEX "Quote_tierId_idx" ON "Quote"("tierId");

-- CreateIndex
CREATE INDEX "QuoteAddOn_quoteId_idx" ON "QuoteAddOn"("quoteId");

-- AddForeignKey
ALTER TABLE "Tier" ADD CONSTRAINT "Tier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureTierConfig" ADD CONSTRAINT "FeatureTierConfig_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureTierConfig" ADD CONSTRAINT "FeatureTierConfig_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "Tier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "Tier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteAddOn" ADD CONSTRAINT "QuoteAddOn_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteAddOn" ADD CONSTRAINT "QuoteAddOn_featureTierConfigId_fkey" FOREIGN KEY ("featureTierConfigId") REFERENCES "FeatureTierConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
