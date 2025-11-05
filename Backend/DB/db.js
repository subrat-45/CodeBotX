import mongoose from "mongoose";

console.log(process.env.MONGO_URI);
function dbConneect() {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.log(err);
    });
}

export default dbConneect;
