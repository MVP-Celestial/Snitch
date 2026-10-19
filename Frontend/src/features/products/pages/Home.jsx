import { useSelector } from 'react-redux'

const Home = () => {
    const products = useSelector(state => state.product.products)
  return (
    <div>Home</div>
  )
}

export default Home