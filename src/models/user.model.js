import mongoose, {Schema} from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema=new Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim:true,
        index:true //make a field more searchable i.e. easy to search
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim:true,
    },
    fullName:{
        type: String,
        required: true,
        trim:true,
        index:true
    },
    avatar:{
        type: String,   //cloudiary url
        required: true,
    },
    coverImage:{
        type: String,   // cloudinary url
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password:{
        type:String,
        required: [true,"password is required"]
    },
    refreshTokens:{
        type:String
    }
},{
    timestamps: true
})


userSchema.pre("save", async function(next){    // middelware hook pre which is just execute before sending data currently used to excrypt data
    if (!this.isModified("password")) return next() ;  //this is to check if only password parameter is changed then only hash it

    this.password=await bcrypt.hash(this.password , 10) // first param is what to hash and 2nd param is how many rounds
    next();
})

userSchema.methods.isPassword=async function (password) {
    return await bcrypt.compare(password, this.password)    
}

userSchema.methods.generateAccessToken= function (params) {
    return jwt.sign({
        _id:this._id,
        email: this.email,
        username: this.username,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    })
}

userSchema.methods.generateRefreshToken=function (params) {
    return jwt.sign({
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_SECRET
    })
}



export const User=mongoose.model("User", userSchema)
