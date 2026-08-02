import { Router } from "express";
import { categoryController } from "../controllers/category.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createCategorySchema,
  updateCategorySchema,
  listCategoryQuerySchema,
  categoryPublicIdSchema,
} from "../validators/category.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(listCategoryQuerySchema, "query"), categoryController.list);
router.get("/:publicId", validate(categoryPublicIdSchema, "params"), categoryController.get);
router.post("/", validate(createCategorySchema), categoryController.create);
router.put(
  "/:publicId",
  validate(categoryPublicIdSchema, "params"),
  validate(updateCategorySchema),
  categoryController.update
);
router.delete("/:publicId", validate(categoryPublicIdSchema, "params"), categoryController.delete);

export default router;