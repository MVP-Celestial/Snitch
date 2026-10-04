import axios from "axios"; //for interacting with the backend api

const productApiInstance = axios.create({
    baseURL: "/api/products",
    withCredentials: true, // Include cookies in requests
})


export async function createProduct(formData) {
    const response = await productApiInstance.post("/create", formData)

    return response.data
}


export async function getSellerProduct() {
    const response = await productApiInstance.get("/seller")

    return response.data
}