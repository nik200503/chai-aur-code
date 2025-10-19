const asyncHandler = (requestHandler) => {
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>(err))
        
    }
}




export {asyncHandler}


//doing the same task as above using async await instead of promoises

/*
const asyncHandler = (fn)=> aync(req,res,next)=>{     //hogher order fn
    try {
        await fn(req, res,next)
    } catch (error) {
        res.status(error.code || 500).json{
            success: false,
            message: error.message
        }
    }
}   
*/
