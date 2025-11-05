import axios from "axios";

const axiosInstance = axios.create({
    baseURL : "https://codebotx-backend.onrender.com",
    headers : {
        "Authorization" : `Bearer ${localStorage.getItem("token")}`
    }
})

export default axiosInstance;
