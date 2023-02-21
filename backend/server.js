const app= require("./app");

const dotenv=require("dotenv");
const connectDatabase=require("./config/database");

// Handling uncaugth Exception eg. console.log(youtube)
// its at the top as it should be included in all files
process.on("uncaughtException",(err)=>{
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to unhandled Promise Rejection`);
    process.exit(1);  
})
//config
dotenv.config({path:"backend/config/config.env"});
// Connecting to database
connectDatabase()

const server=app.listen(process.env.PORT,()=>{
    console.log(`Server is working on localhost:${process.env.PORT}`);
})

// handling databse error eg. mongo insted of mongodb in the config file
process.on("unhandledRejection",(err)=>{
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to unhandled Promise Rejection`);
    server.close(()=>{
        process.exit(1);
    });
});