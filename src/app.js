import express  from "express"
import cors from "cors"
import cookieParser from "cookie-parser" //to execute crud operation on cookies

const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials : true 
}))

app.use(express.json({limit : "16kb"})) // configureing how to get json data and setting memory limit
app.use(express.urlencoded({extended: true , limit: "16kb"})) // exted means object ke andar ke object bhi le sakte hai an urlencoded is to parse the url
app.use(express.static("public"))  // creating a folder named "public" which willl store public data that can be accesde by anyone
app.use(cookieParser())





export {app}