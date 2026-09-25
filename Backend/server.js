import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();  //before starting the server connect to mongodb

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    }); //start the server

  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

//Flow -> Connect to db -> start the server or catch the error incase of any problem



