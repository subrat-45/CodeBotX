import { Router } from "express";
import * as userController from "../Controllers/userController.js";
import { body } from "express-validator";
import * as loggedinUser from "../Middleware/loggedinUser.js"

const router = Router();

router.post(
  "/register",
  body("email").isEmail().withMessage("Email must be valid email address"),
  body("password")
    .isLength({ min: 3 })
    .withMessage("Password must be at least 3 character long"),
  userController.createUsercontroller
);

router.post(
  "/login",
  body("email").isEmail().withMessage("Email must be valid email address"),
  body("password")
    .isLength({ min: 3 })
    .withMessage("Password must be at least 3 character long"),
  userController.loginController
);

router.get("/all", loggedinUser.authUser, userController.getAlluserController)

router.get("/profile",loggedinUser.authUser, userController.profileController);

router.get("/logout",loggedinUser.authUser, userController.logoutController);

export default router;
