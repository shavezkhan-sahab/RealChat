import mongoose from "mongoose";

const connectdb=async=>{

  try{
     mongoose.connect(process.env.MONGODB_URI)
     console.log("db connected")
  }
  catch(error){
       console.log("db error")
  }
}

export default connectdb