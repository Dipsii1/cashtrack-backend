import { Router } from "express";
import { recurringTransactionController } from "../controllers/recurring-transaction.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createRecurringSchema,
  updateRecurringSchema,
  listRecurringQuerySchema,
  recurringPublicIdSchema,
} from "../validators/recurring-transaction.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(listRecurringQuerySchema, "query"), recurringTransactionController.list);
router.get("/:publicId", validate(recurringPublicIdSchema, "params"), recurringTransactionController.get);
router.post("/", validate(createRecurringSchema), recurringTransactionController.create);
router.put(
  "/:publicId",
  validate(recurringPublicIdSchema, "params"),
  validate(updateRecurringSchema),
  recurringTransactionController.update
);
router.delete("/:publicId", validate(recurringPublicIdSchema, "params"), recurringTransactionController.delete);

export default router;