import { Router } from "express";
import { savingsContributionController } from "../controllers/savings-contribution.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { createSavingsContributionSchema } from "../validators/savings-contribution.validator.js";

const router = Router();

router.get("/", savingsContributionController.list);
router.get("/:publicId", savingsContributionController.get);
router.post("/", validate(createSavingsContributionSchema), savingsContributionController.create);
router.delete("/:publicId", savingsContributionController.delete);

export default router;
