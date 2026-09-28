import { Router } from "express"
import {validateRegisterUser, validateLoginUser} from "../validator/auth.validator.js"
import { register, login } from "../controllers/auth.controller.js";


const router = Router();

// register on the right  has no (). Why? Because we're not saying:"Run this function right now."We're saying:
// "Express, here is a function. Run it when someone makes a POST request to /register."
router.post('/register', validateRegisterUser, register)

router.get('/login', validateLoginUser,login)


export default router



//the main purpose of a routes file is to match incoming web requests (based on the URL path and HTTP method) and direct them to the correct controller and action