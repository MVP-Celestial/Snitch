import { param, body,validationResult } from 'express-validator';

const validateRequest = (req, res, next) => {
    const errors = validateResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array() })
    }
    next()
}

export const validateAddToCard = [
    param("productId").isMongoId().withMessage("Invalid Product Id"),
    param("variantId").optional().isMongoId().withMessage("Invalid variant Id"),
    body("quantity").optional().isInt({min: 1}).withMessage("quantity must be atleast 1"),
    validateRequest
]

export const validateIncrementCartItemQuantity = [
    param("productId").isMongoId().withMessage("Invalid Product Id"),
    param("variantId").optional().isMongoId().withMessage("Invalid variant Id"),
    validateRequest
]
