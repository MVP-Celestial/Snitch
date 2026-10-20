import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useProduct } from '../hooks/useProduct'

const ProductDetail = () => {
  const { productId } = useParams()
  const [product, setProduct] = useState(null)
  const { handleGetProductById } = useProduct()

  useEffect(() => {
    async function fetchProductDetails() {
      const data = await handleGetProductById(productId)
      setProduct(data)
    }

    fetchProductDetails()
  }, [productId, handleGetProductById])

  console.log('Product Details:', product)

  return (
    <div>ProductDetail</div>
  )
}

export default ProductDetail
