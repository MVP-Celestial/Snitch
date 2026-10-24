import express from 'express';
import cartModel from '../models/cart.model';
import {authenticateUser} from "../middleware/auth.middleware.js"
import { validateAddToCard } from '../validator/cart.validator';
import { addToCart, getCart } from '../controllers/cart.controller.js';

const router = express.Router();

router.post("/add/:productId/:variantId", authenticateUser, validateAddToCard, addToCart )

router.get("/", authenticateUser,getCart )

export default router;