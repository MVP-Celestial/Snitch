import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { addItem, getCart, incrementCartItemApi } from '../service/cart.api.js'
import { setItems } from '../state/cart.slice.js'

export const useCart = () => {
  const dispatch = useDispatch()
  const handleGetCart = useCallback(async (signal) => {
    const data = await getCart(signal)
    const items = data.cart?.items || []
    if (!signal?.aborted) dispatch(setItems(items))
    return items
  }, [dispatch])

  const handleAddItem = async (productId, variantId) => {
    const data = await addItem(productId, variantId)
    await handleGetCart()
    return data.item
  }

  const handleIncrementCartItem = async (productId, variantId) => {
    await incrementCartItemApi(productId, variantId)
    return handleGetCart()
  }
  return { handleAddItem, handleGetCart, handleIncrementCartItem }
}
