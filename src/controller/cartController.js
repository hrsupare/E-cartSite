const userModel = require("../model/userModel")
const cartModel = require("../model/cartModel")
const productModel = require("../model/productModel")
const mongoose = require("mongoose")


// <====================== createCart =========================>

const createCart = async (req, res) => {

    try {
        const userId = req.params.userId
        let data = req.body
        const { productId } = data

        if (!productId || productId.trim().length == 0) return res.status(400).send({ status: false, message: "productId is Required.." })

        if (userId == 0) return res.status(400).send({ status: false, message: "userId is empty.." })
        if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "userId is not Valid ObjectId.." })

        let findUser = await userModel.findOne({ _id: userId })

        if (!findUser) return res.status(404).send({ status: false, message: "User not found" })

        //// /------------------------------authorisation-----------------------------------

        if (userId != req.userDetail)
            return res.status(403).send({ status: false, message: "you are not Authorised" })
        ///// /-------------------------------------------------------------------------------

        if (!mongoose.isValidObjectId(productId)) return res.status(400).send({ status: false, message: "ProductId is not Valid ObjectId.." })

        let newCart = await cartModel.findOne({ userId: userId })

        if (!newCart) {

            let findproduct = await productModel.findOne({ _id: productId, isDeleted: false })
            if (!findproduct) return res.status(404).send({ status: false, message: " Product not found" })

            let addCart = {
                userId: userId,
                items: [{
                    productId: productId,
                    quantity: 1
                }],
                totalPrice: findproduct.price,
                totalItems: 1
            }
            data = addCart
            let saveData = await cartModel.create(data)
            return res.status(201).send({ status: true, message: 'Success', data: saveData })
        }

        let isAvilabProduct = newCart.items.some(ele => ele.productId == productId);

        if (newCart) {

            let findproduct = await productModel.findOne({ _id: productId, isDeleted: false })
            if (!findproduct) return res.status(404).send({ status: false, message: " Product not found" })

            if (isAvilabProduct) {
                let productAdd = await cartModel.findOneAndUpdate({ userId: userId, "items.productId": productId }, { $inc: { totalPrice: +findproduct.price, "items.$.quantity": +1 } }, { new: true })   //positional operator($) is used to increase in array
                return res.status(200).send({ status: true, message: 'Success', data: productAdd })
            } else {

                let NewproductAdd = await cartModel.findOneAndUpdate({ userId: userId }, { $push: { items: { productId, quantity: +1 } }, totalPrice: newCart.totalPrice + findproduct.price, totalItems: newCart.totalItems + 1 }, { new: true })
                return res.status(200).send({ status: true, message: 'Success', data: NewproductAdd })
            }


        }
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


// <====================== updateCart =========================>

const updateCart = async function (req, res) {

    try {
        const userId = req.params.userId
        const data = req.body
        const { productId, cartId, removeProduct } = data

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Body cannot be empty" });
        }

        //<------- userId Validation ----->
        if (userId.trim().length == 0) {
            return res.status(400).send({ status: false, message: "Heeyyy... user! please provide me UserId" })
        }
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: `Heeyyy... user! ${userId} it's not valid UserId Please check Ones` })
        }

        const userData = await userModel.findById(userId)

        if (!userData) {
            return res.status(404).send({ status: false, message: `Heeyyy...! There is No user With the ${userId} userId` })
        }

        //<-------- Authorisation ------------------>
        if (userId != req.userDetail) {
            return res.status(403).send({ status: false, message: `Heeyyy...Spam! you are not authorised to update the cart Items` })
        }

        //<-------- cartId Validation ----->
        if (!cartId || cartId.trim().length == 0) {
            return res.status(400).send({ status: false, message: `Heeyyy...User! Without cartId you cant Update cart` })
        }

        if (!mongoose.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: `Heeyyy... user! ${cartId} it's not valid cartId Please check Ones` })
        }

        var cartData = await cartModel.findById(cartId)

        if (!cartData) {
            return res.status(404).send({ status: false, message: `Heeyyy...! There is No cart With the ${cartId} cartId please create cart` })
        }

        if (userId != cartData.userId) {
            return res.status(404).send({ status: false, message: `Heeyyy... user! ${cartId} this cartId is not belongs to Logged In user` })
        }

        //<---------- product ---------------->

        if (!productId || productId.trim().length == 0) {
            return res.status(400).send({ status: false, message: `Heeyyy...User! Without productId you cant Update product quantity` })
        }

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: `Heeyyy... user! ${productId} it's not valid productId Please check Ones` })
        }

        let arr = []
        for (let i = 0; i < cartData.items.length; i++) {
            arr.push(cartData.items[i].productId.toString())
        }

        if (!arr.includes(productId)) {
            return res.status(404).send({ status: false, message: `Heeyyy... user! product with ${productId} this productId is not present in the cart so first add product in cart` })
        }
        const findProductInDB = await productModel.findOne({ _id: productId })

        if (!findProductInDB) {
            return res.status(404).send({ status: false, message: `Heeyyy... user! product with ${productId} this productId is not present` })
        }

        // <---------- remove product ---->
        if (!(removeProduct == 0 || removeProduct == 1)) {
            return res.status(400).send({ status: false, message: `Sorryyy....! removeProduct Value should  0 = remove all || 1 = remove one  ` })
        }

        let array = []
        const { items, totalPrice } = cartData
        ProductPrice = findProductInDB.price

        for (let i = 0; i < items.length; i++) {

            if (productId == items[i].productId.toString()) {

                if (findProductInDB.isDeleted == true) {

                    cartData.totalPrice = totalPrice - ProductPrice * items[i].quantity

                }

                else if (findProductInDB.isDeleted == false) {
                    if (removeProduct == 1) {

                        if (items[i].quantity == 0) {
                            return res.status(400).send({ status: false, message: `Sorryyy....! Cart has no items to remove` })
                        }

                        items[i].quantity = items[i].quantity - 1

                        cartData.totalPrice = totalPrice - ProductPrice * 1

                        if (items[i].quantity != 0) { array.push(items[i]) }
                    }

                    else if (removeProduct == 0) {

                        if (items[i].quantity == 0) {
                            return res.status(400).send({ status: false, message: `Sorryyy....! Cart has no items to remove` })
                        }

                        let ProductPriceCount = ProductPrice * items[i].quantity

                        items[i].quantity = items[i].quantity - items[i].quantity

                        cartData.totalPrice = totalPrice - ProductPriceCount

                    }
                }
            } else if (productId != items[i].productId.toString()) {
                array.push(cartData.items[i])
            }

        }
        cartData.items = array

        cartData.totalItems = array.length

        const updateCartData = await cartModel.findByIdAndUpdate({ _id: cartId }, cartData, { new: true })
        return res.status(200).send({ status: true, message: 'cart details updated successfully.', data: updateCartData });
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

// <====================== getCart =========================>

const getCart = async function (req, res) {
    try {
        const userId = req.params.userId;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Enter the Valid UserID" })
        }
        let findUser = await userModel.findOne({ _id: userId })
        if (!findUser) { return res.status(404).send({ status: false, message: " User not Found" }) }


        //<-------- Authorisation ------------------>
        if (userId != req.userDetail) { return res.status(403).send({ status: false, message: "you are not Authorised" }) }

        let checkCart = await cartModel.findOne({ userId: userId })
        // console.log(checkCart)
        if (!checkCart) { return res.status(404).send({ status: false, message: " cart not Found" }) }

        return res.status(200).send({ status: true, message: "succsefully fetched Cart", data: checkCart })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

// <====================== deleteCart =========================>

const deleteCart = async function (req, res) {
    try {
        const userId = req.params.userId;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Enter the Valid UserID" })
        }
        let findUser = await userModel.findOne({ _id: userId })
        if (!findUser) { return res.status(404).send({ status: false, message: " User is not Found" }) }

        //<-------- Authorisation ------------------>
        if (userId != req.userDetail) { return res.status(403).send({ status: false, message: "you are not Authorised" }) }

        let checkCart = await cartModel.findOne({ userId: userId })

        if (!checkCart) { return res.status(404).send({ status: false, message: "Cart not Found" }) }

        let deleteCartItems = await cartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [], totalPrice: 0, totalItems: 0 } }, { new: true })

        return res.status(204).send({ status: true, message: "Cart deleted successfully", data: deleteCartItems })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


module.exports = { createCart, updateCart, getCart, deleteCart }
