import { Router } from "express";
import { attachmentController } from "../controllers/attachment.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createAttachmentSchema,
  listAttachmentQuerySchema,
  attachmentPublicIdSchema,
} from "../validators/attachment.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(listAttachmentQuerySchema, "query"), attachmentController.list);
router.post("/", validate(createAttachmentSchema), attachmentController.create);
router.delete("/:publicId", validate(attachmentPublicIdSchema, "params"), attachmentController.delete);

export default router;