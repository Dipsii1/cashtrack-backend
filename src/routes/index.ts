import { Router } from "express";
import authRoutes from "./auth.route.js";
import walletRoutes from "./wallet.route.js";
import categoryRoutes from "./category.route.js";
import transactionRoutes from "./transaction.route.js";
import budgetRoutes from "./budget.route.js";
import savingsGoalRoutes from "./savings-goal.route.js";
import recurringTransactionRoutes from "./recurring-transaction.route.js";
import attachmentRoutes from "./attachment.route.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/wallets", walletRoutes);
router.use("/categories", categoryRoutes);
router.use("/transactions", transactionRoutes);
router.use("/budgets", budgetRoutes);
router.use("/savings-goals", savingsGoalRoutes);
router.use("/recurring-transactions", recurringTransactionRoutes);
router.use("/attachments", attachmentRoutes);

export default router;