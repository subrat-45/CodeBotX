import { Router } from "express";
import * as aiController from "../Controllers/aiController.js"
const route = Router();

route.get("/get-result",aiController.getresult)

export default route;