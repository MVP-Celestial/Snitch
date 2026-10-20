import axios from "axios"; //for interacting with the backend api

const productApiInstance = axios.create({
    baseURL: "/api/products",
    withCredentials: true, // Include cookies in requests
})


export async function createProduct(formData) {
    const response = await productApiInstance.post("/", formData)

    return response.data
}


export async function getSellerProduct() {
    const response = await productApiInstance.get("/seller")

    return response.data
}

export async function getAllProducts(signal) {
    const response = await productApiInstance.get("/", { signal })

    return response.data

}

export async function getProductById(productId) {
    const response = await productApiInstance.get(`/detail/${productId}`)

    return response.data
}
