import { Router } from "express";
import { getUser, loginUser, registerUser } from "../controllers/auth.controller";
import {
  getUserValidator,
  loginUserValidator,
  registerUserValidator,
} from "../middlewares/validators/auth.validator";

const router = Router();

router.post("/register", registerUserValidator, registerUser);
router.post("/login", loginUserValidator, loginUser);
router.get("/:id", getUserValidator, getUser);

export default router;