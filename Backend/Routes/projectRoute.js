import { Router } from "express";
import { body } from "express-validator";
import * as projectController from "../Controllers/projectController.js"
import * as loggedinUser from "../Middleware/loggedinUser.js"

const router = Router();

router.post("/create",
    loggedinUser.authUser,
    body('name').isString().withMessage('Name is required'),
    projectController.createProject
)

router.get("/all",
    loggedinUser.authUser,
    projectController.getAllProject
)

router.put("/add-user",
    loggedinUser.authUser,
    body("projectId").isString().withMessage("Project Id required"),
    body("users").isArray({ min : 1 }).withMessage("User must be an array of string").bail()
    .custom((users) => users.every(user => typeof user === "string")).withMessage("Each user must be a string"),
    projectController.addUserToProject
)

router.get("/get-project/:projectId", 
    loggedinUser.authUser,
    projectController.getProjectById
)


export default router;