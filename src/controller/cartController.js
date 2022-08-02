const userModel = require("../model/userModel")
const cartModel = require("../model/cartModel")
const productModel = require("../model/productModel")
const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const createCart = async (req, res) => {
    try {
        const userId = req.params.userId
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Please add The Valid userId" })
        }
        var data = req.body;
        if (!Object.keys(data).length) return res.status(400).send({ status: false, message: "body is Required.." })

        const uniqueUser = await cartModel.findOne({ userId: userId })
        if (uniqueUser) {
            console.log(uniqueUser)
            const { productId, quantity, cartId } = data
            let add = {}
            if (!cartId) return res.status(400).send({ status: false, message: "Please add cartId in reqbody as user have cart already" })
            if (!mongoose.isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, message: "Please add The Valid cartId" })
            }
            if (!mongoose.isValidObjectId(productId)) {
                return res.status(400).send({ status: false, message: "Please add The Valid productId" })
            }

            let products = await productModel.findOne({ _id: productId }, { isDeleted: false })
            if (!products) return res.status(400).send({ status: false, message: "add products in cart" })


            add.totalPrice = products.price
            add.totalItems = uniqueUser.items.length
            add.items = { $push: { items: productId } }
            console.log(add)
            const saveData = await cartModel.findOneAndUpdate({ _id: cartId }, add, { new: true })
            //console.log(saveData)
            res.status(200).send({ status: true, message: "Cart updated Successfully", data: saveData })
        }

        else {
            const { productId, quantity } = data
            data.userId = userId
            let items = []
            let obj = {}

            if (!mongoose.isValidObjectId(productId)) {
                return res.status(400).send({ status: false, message: "Please add The Valid productId" })
            }
            if (productId) {
                obj.productId = productId
                // items.push(obj)
                data.items = items
                delete data.productId
            }

            console.log(data)
            if (quantity) {
                if (!/^([1-9]\d*)$/.test(quantity)) return res.status(400).send({ status: false, message: "enter valid quantity" })
                obj.quantity = quantity
                items.push(obj)
            } else {
                obj.quantity = 1
                items.push(obj)
            }
            console.log(data)
            let products = await productModel.findOne({ _id: productId }, { isDeleted: false })
            if (!products) return res.status(400).send({ status: false, message: "add products in cart" })
            console.log(products)

            data.totalPrice = products.price
            data.totalItems = items.length

            console.log(data)
            const saveData = await cartModel.create(data)
            //console.log(saveData)
            res.status(201).send({ status: true, message: "Cart created Successfully", data: saveData })
        }
    } catch (err) {
        res.status(500).send({ status: false, message: err.message })


    }
}
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
module.exports.createCart = createCart
module.exports.updateCart = updateCart
