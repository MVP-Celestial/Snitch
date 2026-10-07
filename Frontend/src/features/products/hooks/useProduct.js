import { createProduct,getSellerProduct } from "../Services/product.api.js"
import { useDispatch } from "react-redux"
import { setSellerProducts } from "../state/product.slice.js"
import { useCallback } from "react"

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
    return { handleCreateProduct, handleGetSellerProduct }
}
