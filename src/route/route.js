const express = require("express");
const router=express.Router();
const{getUser,createUser,loginUser,updateUserDetail} =require("../controller/userController")
const {authenticate} =require("../middleware/auth")





router.get('/user/:userId/profile',authenticate,getUser)
router.post('/register',createUser)
router.post('/login',loginUser)
router.put('/user/:userId/profile',authenticate,updateUserDetail)




module.exports=router;