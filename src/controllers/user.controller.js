import { asyncHandler } from "../utils/asyncHandler.js";
import { User} from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { response } from "express";
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user= await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false}) //dont run any validations like password required

        return {accessToken,refreshToken}

    } catch (error) {
        console.error("REAL ERROR IN TOKEN GENERATION: ", error);
        throw new ApiError(500,"something went wrong while generating refresh and access tokens")
    }
}

const registerUser= asyncHandler(async(req, res)=>{
    //step 1 get user details from frontend 
    //step 2 apply validation like everything is not empty
    // step 3 check if user already exist or not by username and email
    //check for images and check for avatar
    // upload them to cloudinary, check avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation 
    // return response


    const {fullName, email, username, password}= req.body

    if (
        [fullName, email, username, password].some((field)=>
        field?.trim()==="")
    ) {
        throw new ApiError(400, "all fields are required")
    }

    const existedUser=await User.findOne({
        $or:[{username}, {email}]
    })

    if (existedUser) {
        throw new ApiError(409, "user with email or username already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath= req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && 
        req.files.coverImage.length>0){
            coverImageLocalPath=req.files.coverImage[0].path
        }


    if (!avatarLocalPath) {
        throw new ApiError(400,"avatar file is required")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "avatar file is required")
    }

    const user= await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser,"user registered successfully")
    )
})

const loginUser = asyncHandler(async (req,res)=>{
    // req body -> data
    // login through email or username
    // find the user
    //password check
    // access and refresh token -- done above in ethod
    // send cookie

    const {email, username, password}= req.body

    if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }

    const user=await User.findOne({
        $or:[{username},{email}]
    })
    if (!user) {
        throw new ApiError(404, "user doesnt exist")
    }
    const isPasswordValid= await user.isPassword(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "wrong password")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggednUser = await User.findById(user._id).select("-password -refreshToken")
    const options={
        httpOnly: true,
        secure: true,
    }

    return res.status(200).cookie("accessToken", accessToken, options).
    cookie("refreshToken",refreshToken,options).
    json(
        new ApiResponse(
            200,
            {
                user:loggednUser, accessToken,
                refreshToken
            },
            "user loggedin successfully"
        )
    )

})

const logoutUser= asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            },
        },{
            new: true
        }
    ) 
    const options={
        httpOnly: true,
        secure: true
    }
    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {},  "user logged out"))

})

const refreshAccessToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unathorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }
    
    
        const options={
            httpOnly:true,
            secure: true
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken", newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,newRefreshToken},
                "access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword}= req.body

    const user= await User.findById(req.user?._id)
    const isPasswordCorrect= await user.isPassword(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400,"invalid old password")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200).json(new ApiResponse(200,{}, "password changed successfully"))
})

const getCurrentUser= asyncHandler(async (req,res) => {
    return res
    .status(200)
    .json(200, req.user, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName, email}= req.body

    if(!fullName || !email){
        throw new ApiError(400, "all fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"account details updated successfully"))
})


const updateUserAvatar = asyncHandler(async (req,res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400,"avatar file is messing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "error while uploading avatar")
    }


    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {
            new : true
        }
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200, user, "avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async (req,res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400,"cover image file is messing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "error while uploading coverImage")
    }


    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {
            new : true
        }
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200, user, "cover image updated successfully")
    )
})


const getUserChannelProfile = asyncHandler(async (req,res) => {
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "usename is missing")
    }

    const channel = User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {$in: [req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel dont exist")
    }

    return res.status(200).json(
        new ApiResponse(200, channel[0], "user channel fetched successfully")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
}