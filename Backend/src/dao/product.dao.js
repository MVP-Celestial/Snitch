import productModel from "../models/product.model";

export const stockOfVariant = async (getProductById, variantId) => {
    const product = await productModel.findOne({
        _id: productId,
        "variants._id": variantId
    })

    const stock = product.variants.find(variant => variant._id.toString() === variantId).stock

    return stock
}