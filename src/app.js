import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser" //to execute crud operation on cookies

const app = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))

app.use(express.json({limit: "16kb"})) // configureing how to get json data and setting memory limit
app.use(express.urlencoded({extended: true, limit: "16kb"})) // exted means object ke andar object
app.use(express.static("public")) // creating a folder named "public" which willl store public data
app.use(cookieParser())


//routes import
import userRouter from "./routes/user.routes.js"; // <-- UNCOMMENT THIS LINE


//routes declaration
app.use("/api/v1/users", userRouter) // <-- UNCOMMENT THIS LINE

export { app }