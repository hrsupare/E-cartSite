const express = require('express')
const router = express.Router();
const { getUser, createUser, loginUser, updateUserDetail } = require("../controller/userController")
const { authenticate } = require("../middleware/auth")
const { getproductbyfilter, createProduct, getProductById, updateProductDetail, deleteProductById } = require("../controller/productController")
const { createCart, updateCart, getCart, deleteCart } = require("../controller/cartController")
const { createOrder, updateOrder } = require("../controller/orderController")


//==================== FEATURE - 1  USER ==============================//

router.post('/register', createUser)

router.post('/login', loginUser)

router.get('/user/:userId/profile', authenticate, getUser)

router.put('/user/:userId/profile', authenticate, updateUserDetail)

//==================== FEATURE - 2 PRODUCT ===============================//

router.post('/products', createProduct)

router.get("/products", getproductbyfilter)

router.get("/products/:productId", getProductById)

router.put("/products/:productId", updateProductDetail)

router.delete("/products/:productId", deleteProductById)

//==================== FEATURE - 3 CART ===============================//

router.post("/users/:userId/cart", authenticate, createCart)

router.put("/users/:userId/cart", authenticate, updateCart)

router.get('/users/:userId/cart', authenticate, getCart)

router.delete('/users/:userId/cart', authenticate, deleteCart)

//=========================== FEATURE - 4 ORDER =========================================//

router.post("/users/:userId/orders", authenticate, createOrder)

router.put("/users/:userId/orders", authenticate, updateOrder)


module.exports = router;
