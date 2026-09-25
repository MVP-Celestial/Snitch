import {body, validationResult} from "express-validator"



function validateRequest(req, res, next) {
    const error = validationResult(req);

    if(!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() });
    }

    next()
}



export const validateRegisterUser = [
    body("email")
    .isEmail().withMessage("Invalid email format"),
    body("contact")
    .notEmpty().withMessage("Contact is required")
    .matches(/^\d{10}$/).withMessage("Contact must be a 10-digit number"),
    body("password")
    .isLength({min: 6}).withMessage("Password must be atleast 6 characters long"),
    body("fullname")
    .notEmpty().withMessage("Fullname is required")
    .isLength({min: 3}).withMessage("Full name must be atleast 3 characters long"),

    validateRequest
]