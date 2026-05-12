import express from "express"; // we are using the ES6 way of interacting with modules for a uniform format in the front and the backend
// express is the function exported by the Express module.
const app = express();

app.listen(3888, () => {
  console.log("server running on port 3888");
});


