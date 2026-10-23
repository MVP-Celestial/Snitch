import { createProduct,getSellerProduct, getAllProducts } from "../Services/product.api.js"
import { useDispatch } from "react-redux"
import { setSellerProducts } from "../state/product.slice.js"
import { useCallback } from "react"
import { setProducts } from "../state/product.slice.js"
import { getProductById } from "../Services/product.api.js"
import { addProductVariant } from "../Services/product.api.js"

export const useProduct = () => {
    const dispatch = useDispatch()
    
    async function handleCreateProduct(formData) {
        const data = await createProduct(formData)
        return data.product
    }

    const handleGetSellerProduct = useCallback(async (signal) => {
        const data = await getSellerProduct(signal)
        if (!signal?.aborted) dispatch(setSellerProducts(data.products))
        return data.products
    }, [dispatch])


    const handleGetAllProducts = useCallback(async (signal) => {
       const data = await getAllProducts(signal)
       if (!signal?.aborted) dispatch(setProducts(data.products))
       return data.products
    }, [dispatch])


    const handleGetProductById = useCallback(async (productId) => {
        const data = await getProductById(productId)
        return data.product
    }, [])

    async function handleAddProductVariant(productId, newProductVariant) {
        const data = await addProductVariant(productId, newProductVariant)

        return data
    }







    return { handleCreateProduct, handleGetSellerProduct, handleGetAllProducts, handleGetProductById, handleAddProductVariant }
}
