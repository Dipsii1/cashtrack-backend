import { Router } from "express";
import { transactionController } from "../controllers/transaction.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionQuerySchema,
  transactionPublicIdSchema,
} from "../validators/transaction.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(listTransactionQuerySchema, "query"), transactionController.list);
router.get("/:publicId", validate(transactionPublicIdSchema, "params"), transactionController.get);
router.post("/", validate(createTransactionSchema), transactionController.create);
router.put(
  "/:publicId",
  validate(transactionPublicIdSchema, "params"),
  validate(updateTransactionSchema),
  transactionController.update
);
router.delete("/:publicId", validate(transactionPublicIdSchema, "params"), transactionController.delete);

export default router;