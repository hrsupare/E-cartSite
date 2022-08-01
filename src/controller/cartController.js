const cartModel = require("../model/cartModel");
const productModel = require("../model/productModel");
//const userModel = require("../model/userModel");
const mongoose = require("mongoose");

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
            const { items, cartId } = data
            if (!mongoose.isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, message: "Please add The Valid cartId" })
            }
            if (!cartId) return res.status(400).send({ status: false, message: "Please add cartId in reqbody as user have cart already" })
            let totalprice = 0
            let array = []
            let quantity = []
            for (let i = 0; i < items.length; i++) {
                if (!mongoose.isValidObjectId(items[i].productId)) {
                    return res.status(400).send({ status: false, message: "Please add The Valid productId" })
                }
                array.push(items[i].productId)
                if (!/^([1-9]\d*)$/.test(items[i].quantity)) return res.status(400).send({ status: false, message: "enter valid quantity" })
                quantity.push(items[i].quantity)
            }

            let products = await productModel.find({ _id: { $in: array } }, { isDeleted: false })
            if (products.length == 0) return res.status(400).send({ status: false, message: "add products in cart" })
            for (let i = 0; i < items.length; i++) {
                totalprice += products[i].price * quantity[i]
            }
            //console.log(totalprice)

            data.totalPrice = totalprice
            data.totalItems = items.length
            //   console.log(data)
            const saveData = await cartModel.findOneAndUpdate({ _id: cartId }, data, { new: true })
            //console.log(saveData)
            res.status(200).send({ status: true, message: "Cart updated Successfully", data: saveData })

        }
        else {
            const { items } = data
            data.userId = userId
            let totalprice = 0
            let array = []
            let quantity = []
            for (let i = 0; i < items.length; i++) {
                if (!mongoose.isValidObjectId(items[i].productId)) {
                    return res.status(400).send({ status: false, message: "Please add The Valid productId" })
                }
                array.push(items[i].productId)
                if (!/^([1-9]\d*)$/.test(items[i].quantity)) return res.status(400).send({ status: false, message: "enter valid quantity" })
                quantity.push(items[i].quantity)
            }

            let products = await productModel.find({ _id: { $in: array } }, { isDeleted: false })
            if (products.length == 0) return res.status(400).send({ status: false, message: "add products in cart" })
            for (let i = 0; i < items.length; i++) {
                totalprice += products[i].price * quantity[i]
            }
            //console.log(totalprice)

            data.totalPrice = totalprice
            data.totalItems = items.length


            const saveData = await cartModel.create(data)
            //console.log(saveData)
            res.status(201).send({ status: true, message: "Cart created Successfully", data: saveData })
        }
    } catch (err) {
        res.status(500).send({ status: false, message: err.message })


    }
}
module.exports = { createCart }