import { Router } from "express";
import { savingsContributionController } from "../controllers/savings-contribution.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createSavingsContributionSchema,
  listSavingsContributionQuerySchema,
} from "../validators/savings-contribution.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(listSavingsContributionQuerySchema, "query"), savingsContributionController.list);
router.get("/:publicId", savingsContributionController.get);
router.post("/", validate(createSavingsContributionSchema), savingsContributionController.create);
router.delete("/:publicId", savingsContributionController.delete);

export default router;
