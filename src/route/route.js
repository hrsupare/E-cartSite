const express = require('express')
const router = express.Router();
const { getUser, createUser, loginUser, updateUserDetail } = require("../controller/userController")
const { authenticate } = require("../middleware/auth")
const { getproductbyfilter, createProduct, getProductById, updateProductDetail, deleteProductById } = require("../controller/productController")
const { createCart, updateCart, getCart, deleteCart } = require("../controller/cartController")
const { createOrder, updateOrder } = require("../controller/orderController")

// ==================== FEATURE - 1  USER ============================ //

router.post('/register', createUser) //h

router.post('/login', loginUser) //c

router.get('/user/:userId/profile', authenticate, getUser) //j

router.put('/user/:userId/profile', authenticate, updateUserDetail) //s

// ==================== FEATURE - 2 PRODUCT ========================== //

router.post('/products', createProduct) //s

router.get("/products", getproductbyfilter)//j

router.get("/products/:productId", getProductById)//h

router.put("/products/:productId", updateProductDetail)//c

router.delete("/products/:productId", deleteProductById)//h

// ==================== FEATURE - 3 CART =============================== //

router.post("/users/:userId/cart", authenticate, createCart) // j s

router.put("/users/:userId/cart", authenticate, updateCart) //h

router.get('/users/:userId/cart', authenticate, getCart) //s

router.delete('/users/:userId/cart', authenticate, deleteCart) //c

// ==================== FEATURE - 4 ORDER =============================== //

router.post("/users/:userId/orders", authenticate, createOrder) //h c

router.put("/users/:userId/orders", authenticate, updateOrder) //j s

// ==================== ERROR =============================== //

router.all("/**", function (req, res) {
    res.status(404).send({
        status: false,
        msg: "The api you request is not available"
    })
})
module.exports = router;
