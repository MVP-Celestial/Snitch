import axios from "axios";

const cartApiInstance = axios.create({
    baseURL: "/api/cart",
    withCredentials: true, // Include cookies in requests
})


export const addItem = async (productId, variantId) => {
    const response = await cartApiInstance.post(`/add/${productId}/${variantId}`);
    return response.data;
};

export const getCart = async () => {
    const response = await cartApiInstance.get(`/`);
    return response.data;
}