import express from 'express'
import { authenticateSeller } from '../middleware/auth.middleware.js'
import { createProduct, getSellerProducts } from '../controllers/product.controller.js'
import multer from 'multer'
import { createProductValidator } from '../validator/product.validator.js'

const upload = multer({
    storage: multer.memoryStorage(), // Store the file in memory
    limits: {
        fileSize: 5 * 1024 * 1024 // Limit file size to 5MB
    }
})
const router = express.Router()

/**
 * @route POST /api/products
 * @description Create a new product
 * @access Private
 */
router.post('/', authenticateSeller,upload.array('images', 7),createProductValidator, createProduct )


/** 
 * @route GET /api/products/seller
 * @description Get all products
 * @access Private (seller only)
 */

router.get('/seller',authenticateSeller,getSellerProducts)



export default router