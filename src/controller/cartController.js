const userModel = require("../model/userModel")
const cartModel = require("../model/cartModel")
const productModel = require("../model/productModel")
const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const updateCart = async function (req, res) {

    try {
        const userId = req.params.userId
        const data = req.body
        const { productId, cartId, removeProduct } = data


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
        if (userId != req.userDetail.userId) {
            return res.status(403).send({ status: false, message: `Heeyyy...Spam! you are not authorised to update the cart Items` })
        }

        //<-------- cartId Validation ----->
        if (!cartId || cartId.trim().length == 0) {
            return res.status(400).send({ status: false, message: `Heeyyy...User! Without cartId you cant Update cart` })
        }
        if (!mongoose.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: `Heeyyy... user! ${cartId} it's not valid cartId Please check Ones` })
        }

        const cartData = await cartModel.findById(cartId)
        // console.log(cartData)

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
        let findProductInDB = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!findProductInDB) {
            return res.status(404).send({ status: false, message: `Heeyyy... user! product with ${productId} this productId is not present` })
        }
        // 62e77a5210cbc87bdb8a7501     62e3f2d6c5f098d13df66248

        let arr = []
        for (let i = 0; i < cartData.items.length; i++) {
            arr.push(cartData.items[i].productId.toString())
        }
        if (!arr.includes(productId)) {
            return res.status(404).send({ status: false, message: `Heeyyy... user! product with ${productId} this productId is not present in the cart so first add product in cart` })
        }

        // <---------- remove product ---->
        if (!/(?:0|1)/.test(removeProduct)) {
            return res.status(400).send({ status: false, message: `Sorryyy....! removeProduct Value should  0 = remove all || 1 = remove one  ` })
        }

        let array = []
        const { items, totalPrice } = cartData
        ProductPrice = findProductInDB.price

        for (let i = 0; i < items.length; i++) {

            if (productId == items[i].productId.toString()) {

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

            } else if (productId != items[i].productId.toString()) {
                array.push(cartData.items[i])
            }

        }
        cartData.items = array

        cartData.totalItems = array.length

        console.log(cartData)
        const updateCartData = await cartModel.findByIdAndUpdate({ _id: cartId }, cartData, { new: true })
        return res.status(200).send({ status: true, message: 'cart details updated successfully.', data: updateCartData });
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}
module.exports.updateCart = updateCart