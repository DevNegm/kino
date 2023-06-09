import axios from 'axios'
const Api = axios.create({
    baseURL: "https://pixabay.com/api/",
    headers: {
        Accept: "application/json",
        "Content-Type":"application/json"
    },
    params:{
        key:"20245595-5e835fabe3b2bd9ec6cfa4ead",
        safesearch:true,
        orientation:"vertical"
    }
})


export default Api
