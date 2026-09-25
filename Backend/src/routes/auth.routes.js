import { Router } from "express"
import {validateRegisterUser} from "../validator/auth.validator.js"
import { register } from "../controllers/auth.controller.js";


const router = Router();


router.post('/register', validateRegisterUser, register)



export default router



//the main purpose of a routes file is to match incoming web requests (based on the URL path and HTTP method) and direct them to the correct controller and action