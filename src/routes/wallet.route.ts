import { Router } from "express";
import { walletController } from "../controllers/wallet.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createWalletSchema,
  updateWalletSchema,
  listWalletQuerySchema,
  walletPublicIdSchema,
} from "../validators/wallet.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(listWalletQuerySchema, "query"), walletController.list);
router.get("/:publicId", validate(walletPublicIdSchema, "params"), walletController.get);
router.post("/", validate(createWalletSchema), walletController.create);
router.put(
  "/:publicId",
  validate(walletPublicIdSchema, "params"),
  validate(updateWalletSchema),
  walletController.update
);
router.delete("/:publicId", validate(walletPublicIdSchema, "params"), walletController.delete);

export default router;