-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "destinationWalletId" BIGINT;

-- CreateTable
CREATE TABLE "SavingsContribution" (
    "id" BIGSERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "savingsGoalId" BIGINT NOT NULL,
    "walletId" BIGINT,
    "amount" DECIMAL(15,2) NOT NULL,
    "note" TEXT,
    "contributionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingsContribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavingsContribution_publicId_key" ON "SavingsContribution"("publicId");

-- CreateIndex
CREATE INDEX "SavingsContribution_userId_idx" ON "SavingsContribution"("userId");

-- CreateIndex
CREATE INDEX "SavingsContribution_savingsGoalId_idx" ON "SavingsContribution"("savingsGoalId");

-- CreateIndex
CREATE INDEX "SavingsContribution_walletId_idx" ON "SavingsContribution"("walletId");

-- CreateIndex
CREATE INDEX "Attachment_transactionId_idx" ON "Attachment"("transactionId");

-- CreateIndex
CREATE INDEX "Budget_userId_walletId_idx" ON "Budget"("userId", "walletId");

-- CreateIndex
CREATE INDEX "Budget_userId_categoryId_idx" ON "Budget"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "RecurringTransaction_userId_nextRunDate_idx" ON "RecurringTransaction"("userId", "nextRunDate");

-- CreateIndex
CREATE INDEX "RecurringTransaction_userId_isActive_idx" ON "RecurringTransaction"("userId", "isActive");

-- CreateIndex
CREATE INDEX "Transaction_userId_destinationWalletId_idx" ON "Transaction"("userId", "destinationWalletId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_destinationWalletId_fkey" FOREIGN KEY ("destinationWalletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsContribution" ADD CONSTRAINT "SavingsContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsContribution" ADD CONSTRAINT "SavingsContribution_savingsGoalId_fkey" FOREIGN KEY ("savingsGoalId") REFERENCES "SavingsGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsContribution" ADD CONSTRAINT "SavingsContribution_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
