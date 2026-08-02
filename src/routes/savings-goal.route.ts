import { Router } from "express";
import { savingsGoalController } from "../controllers/savings-goal.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  listSavingsGoalQuerySchema,
  savingsGoalPublicIdSchema,
} from "../validators/savings-goal.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(listSavingsGoalQuerySchema, "query"), savingsGoalController.list);
router.get("/:publicId", validate(savingsGoalPublicIdSchema, "params"), savingsGoalController.get);
router.post("/", validate(createSavingsGoalSchema), savingsGoalController.create);
router.put(
  "/:publicId",
  validate(savingsGoalPublicIdSchema, "params"),
  validate(updateSavingsGoalSchema),
  savingsGoalController.update
);
router.delete("/:publicId", validate(savingsGoalPublicIdSchema, "params"), savingsGoalController.delete);

export default router;