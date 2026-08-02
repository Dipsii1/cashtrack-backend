import { Router } from "express";
import { budgetController } from "../controllers/budget.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createBudgetSchema,
  updateBudgetSchema,
  listBudgetQuerySchema,
  budgetPublicIdSchema,
} from "../validators/budget.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(listBudgetQuerySchema, "query"), budgetController.list);
router.get("/:publicId", validate(budgetPublicIdSchema, "params"), budgetController.get);
router.post("/", validate(createBudgetSchema), budgetController.create);
router.put(
  "/:publicId",
  validate(budgetPublicIdSchema, "params"),
  validate(updateBudgetSchema),
  budgetController.update
);
router.delete("/:publicId", validate(budgetPublicIdSchema, "params"), budgetController.delete);

export default router;