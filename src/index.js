// require('dotenv').config({path: './env'})

//another way to do above work
import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path:'./env'
})



connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{    //if connected to db then use its port or use 8000 helps in case server crashed
        console.log(`server is running at port : ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("mongo db connection failed", err)
})

/*import mongoose from "mongoose"
import {DB_NAME} from "./constants"*/

/*
this is one of connecting db with try and catch as well as async await
import express from "express"

const app=express()


( async () => {
    try {
        await mongoose.connect(`${process.env.MONGOBD_URI}/${DB_NAME}`)
        app.on("error",()=>{
            console.log("error:", error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`app is listening on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("error", error)
        throw err
    }
})()//iffie
*/
