import { createProduct,getSellerProduct, getAllProducts } from "../Services/product.api.js"
import { useDispatch } from "react-redux"
import { setSellerProducts } from "../state/product.slice.js"
import { useCallback } from "react"
import { setProducts } from "../state/product.slice.js"

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


    async function handleGetAllProducts() {
       const data = await getAllProducts() 
       dispatch(setProducts(data.products))
    }







    return { handleCreateProduct, handleGetSellerProduct, handleGetAllProducts }
}
