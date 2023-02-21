const mongoose = require("mongoose");
const connectDatabase = () => {
  console.log(process.env.DB_URI);
  mongoose.connect(process.env.DB_URI).then((data) => {
    console.log(
      `Mongodb connected with server: ${data.connection.host}/${data.connection.port} `
    );
  });
};
module.exports = connectDatabase;
