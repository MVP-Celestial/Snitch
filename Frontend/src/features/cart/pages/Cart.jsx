import React from 'react'

import {useSelector} from 'react-redux/es/hooks/useSelector'
import {useCart} from '../hook/useCart.js'
import { useEffect } from 'react'

const Cart = () => {
 const cartItems = useSelector((state) => state.cart.items)
 const {handleGetCart} = useCart()
 console.log(cartItems)

 useEffect(() => {
    handleGetCart()
 }, [])

  return (
    <div>Cart</div>
  )
}

export default Cart