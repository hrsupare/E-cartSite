const express = require("express")
const bodyParser=express.json()
const mongoose =require("mongoose")
const route = require("./route/route")
const app =express()

app.use(bodyParser)


mongoose.connect("mongodb+srv://Jagcho:71nEXJtXcYfVx8T6@cluster0.5bg4mzz.mongodb.net/group71Database",{
    useNewUrlParser: true
})
.then(()=> console.log('mongoDb is connected'))
.catch((error) => console.log(error));

app.use("/",route)

app.listen(3000, function () {
    console.log("Express app running on port " +  3000);
  });
  