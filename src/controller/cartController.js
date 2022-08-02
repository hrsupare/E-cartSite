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

            if (productId) {
                for (let i = 0; i < uniqueUser.items.length; i++) {
                    if (productId == uniqueUser.items[i].toString()) {
                        let products = await productModel.findOne({ _id: productId }, { isDeleted: false })
                        add.totalPrice = uniqueUser.totalPrice + products.price
                        add.totalItems = uniqueUser.items.length + 1
                        add.items = { $push: { items: productId } }
                        console.log(add)
                        const saveData = await cartModel.findOneAndUpdate({ _id: cartId }, add, { new: true })
                        //console.log(saveData)
                        res.status(200).send({ status: true, message: "Cart updated Successfully", data: saveData })
                    } else {
                        let products = await productModel.findOne({ _id: productId }, { isDeleted: false })
                       


                        add.totalPrice = uniqueUser.totalPrice + products.price
                        add.totalItems = uniqueUser.items.length + 1
                        add.items = { $push: { items: productId } }
                        console.log(add)
                        const saveData = await cartModel.findOneAndUpdate({ _id: cartId }, add, { new: true })
                        //console.log(saveData)
                        res.status(200).send({ status: true, message: "Cart updated Successfully", data: saveData })
                    }
                }
            }
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
module.exports = { createCart }