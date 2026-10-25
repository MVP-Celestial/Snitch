import cartModel from "../models/cart.model.js";
import productModel from "../models/product.model.js";
import { stockOfVariant } from "../dao/product.dao.js";

export const addToCart = async (req, res) => {

    const {productId, variantId} = req.params

    const product = await productModel.findOne({
        _id: productId,
        "variant._id": variantId
    })

    if(!product) {
       return res.status(404).json({
            message: "product or variant not found",
            success: false
        })
    }

    const stock = await stockOfVariant(productId, variantId)

    const cart = (await cartModel.findOne({ user: req.user._id })) || (await cartModel.create({user: req.user._id}))

    const isProductAlreadyInCart = cart.items.some(item => item.product.toString() === productId && item.varient?.toString() === variantId)

    if(isProductAlreadyInCart) {

        const quantityInCart = cart.items.find(item => item.product.toString() === productId && item.varient?.toString() === variantId).quantity
         if(quantityInCart + quantity > stock) {
            return res.status(400).json({
                message: `Only ${stock - quantityInCart} items left in stock`,
                success: false
            })
         }

         await cartModel.findOneAndUpdate(
            { user: req.user._id, "items.product": productId, "items.varient": variantId },
            { $inc: { "items.$.quantity": quantity } },
            { new: true }
        )

        return res.status(200).json({
            message: "Product quantity updated in cart",
            success: true
        })

         

    }

    if(quantity > stock) {
        return res.status(400).json({
            message: `Only ${stock} items left in stock`,
            success: false
        })
    }

    cart.items.push({
        product: productId,
        varient: variantId,
        quantity,
        price: product.price
    })

    await cart.save()

    res.status(200).json({
        message: "Product added to cart",
        success: true
    })


}


export const getCart = async (req, res) => {
    const user = req.user;
    const cart = await cartModel.findOne({ user: user._id }).populate('items.product')

    if (!cart) {
        cart = await cartModel.create({ user: user._id});
    }



    res.status(200).json({
        message: "Cart retrieved successfully",
        success: true,
        cart
    });
}

export const incrementCartQuantity = async (req, res) => {
    const { productId, variantId } = req.params;

    const product = await productModel.findOne({
        _id: productId,
        "variant._id": variantId
    });

    if (!product) {
        return res.status(404).json({
            message: "Product or variant not found",
            success: false
        });
    }

    // Implementation for incrementing cart quantity would go here

    const cart = await cartModel.findOne({ user: req.user._id });

    if (!cart) {
        return res.status(404).json({
            message: "Cart not found",
            success: false
        });
    }

    const stock = await stockOfVariant(productId, variantId);

    const itemQuantityInCart = cart.items.find(item => item.product.toString() === productId && item.varient?.toString() === variantId)?.quantity || 0;

    if(itemQuantityInCart + 1 > stock) {
        return res.status(400).json({
            message: `Only ${stock - itemQuantityInCart} items left in stock`,
            success: false
        });
    }

    await cartModel.findOneAndUpdate(
        { user: req.user._id, "items.product": productId, "items.varient": variantId },
        { $inc: { "items.$.quantity": 1 } },
        { new: true }
    );

    return res.status(200).json({
        message: "Product quantity incremented in cart",
        success: true
    });
}