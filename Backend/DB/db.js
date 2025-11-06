// In your main server file (app.js or server.js)
import mongoose from "mongoose";

const DbConnect = () => {
  mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully');
  // Start server only after DB connection
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});
}
export default DbConnect;
