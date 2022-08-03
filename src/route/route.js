const express = require('express')
const router = express.Router();
const { getUser, createUser, loginUser, updateUserDetail } = require("../controller/userController")
const { authenticate } = require("../middleware/auth")
const { getproductbyfilter, createProduct, getProductById, updateProductDetail, deleteProductById } = require("../controller/productController")
const { createCart,updateCart } = require("../controller/cartController")
//==================== User ==============================//

router.post('/register', createUser)

router.post('/login', loginUser)

router.get('/user/:userId/profile', authenticate, getUser)

router.put('/user/:userId/profile', authenticate, updateUserDetail)

//==================== product ===============================//

router.post('/products', createProduct)

router.get("/products", getproductbyfilter)

router.get("/products/:productId", getProductById)

router.put("/products/:productId", updateProductDetail)

router.delete("/products/:productId", deleteProductById)

//==================== Cart ===============================//

router.post("/users/:userId/cart",authenticate, createCart)

router.put("/users/:userId/cart", authenticate, updateCart)




module.exports = router;
