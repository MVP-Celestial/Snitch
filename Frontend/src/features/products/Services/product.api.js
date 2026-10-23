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


export async function addProductVariant(productId, newProductVariant) {
    const formData = new FormData()

    newProductVariant.images.forEach((image)=> {
        formData.append(`images`, image.file)
    })

    formData.append("stock", newProductVariant.stock)
    formData.append("priceAmount", newProductVariant.price.amount)
    formData.append("attributes", JSON.stringify(newProductVariant.attributes))

    const response = await productApiInstance.post(`/${productId}/variants`, formData)

    return response.data
}
