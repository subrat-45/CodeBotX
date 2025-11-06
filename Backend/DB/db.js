import mongoose from "mongoose";

const dbConnect = async () => {
  // Debug: Check if MONGODB_URI is loaded
  console.log('MONGODB_URI:', process.env.MONGODB_URI);
  console.log('All env vars:', Object.keys(process.env).filter(k => k.includes('MONGO')));
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in environment variables!');
    console.error('Please check your .env file');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

export default dbConnect;
