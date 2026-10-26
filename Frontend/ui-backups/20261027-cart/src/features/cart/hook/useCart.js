import {addItem, getCart, incrementCartItemApi} from "../service/cart.api.js"
import {useDispatch} from "react-redux";
import {addItem as addItemToCart,setItems,incrementCartItem} from "../state/cart.slice.js"

export const useCart = () => {
    const dispatch = useDispatch()

    async function handleAddItem(productId, variantId) {
        const data = await addItem(productId, variantId)
        dispatch(addItemToCart(data.item))
        return data.item
    }

    async function handleGetCart() {

        const data = await getCart()
        dispatch(setCart(data.cart.items))

    }

    async function handleIncrementCartItem(productId, variantId) {
        const data = await incrementCartItemApi(productId, variantId)
        dispatch(incrementCartItem({ productId, variantId }))
        return data.item
    }



    return { handleAddItem,handleGetCart, handleIncrementCartItem }

}