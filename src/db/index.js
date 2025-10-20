import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB= async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`); // to check on which database we have connected 
    } catch (error) {
        console.log("mongoDB connection error",error);
        process.exit(1) //way to terminate  similar to throw error 

    }
}

export default connectDB