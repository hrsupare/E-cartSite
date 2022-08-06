const orderModel = require("../model/orderModel")
const userModel = require("../model/userModel")
const cartModel = require("../model/cartModel")
const mongoose = require("mongoose")

//=/=/=/=/=/=/=/=/=/=/=/=/=/=/======== createOrder ========/=/=/=/=/=/=/=/=/
const createOrder = async function (req, res) {
    try {
        const userId = req.params.userId
        const cartId = req.body.cartId
    
        let data = {}

        //<------- userId Validation ----->
        if (userId.trim().length == 0) {
            return res.status(400).send({ status: false, message: "Heeyyy... user! please provide me UserId" })
        }
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: `Heeyyy... user! ${userId} it's not valid UserId Please check Ones` })
        }

        const userData = await userModel.findById(userId.toString())

        if (!userData) {
            return res.status(404).send({ status: false, message: `Heeyyy...! There is No user With the ${userId} userId` })
        }
        data.userId = userId

        //<-------- Authorisation ------------------>
        if (userId != req.userDetail) {
            return res.status(403).send({ status: false, message: `you are not authorised to create Order` })
        }

        //<-------- cartId Validation ----->
        if (!cartId || cartId.trim().length == 0) {
            return res.status(400).send({ status: false, message: `Heeyyy...User! Without cartId you can't create Order` })
        }

        if (!mongoose.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: `Heeyyy... user! ${cartId} it's not valid cartId Please check Ones` })
        }

        const cartData = await cartModel.findById(cartId.toString())

        if (!cartData) {
            return res.status(404).send({ status: false, message: `Heeyyy...! There is No cart With the ${cartId} cartId please create cart` })
        }

        if (userId != cartData.userId) {
            return res.status(404).send({ status: false, message: `Heeyyy... user! ${cartId} this cartId is not belongs to Logged In user` })
        }

        data.items = cartData.items

        if (cartData.items.length == 0) {
            return res.status(400).send({ status: false, message: `Sorry... user! There is No Product in cart first add Product IN cart` })
        }

        const { items } = cartData
        data.totalPrice = cartData.totalPrice
        data.totalItems = cartData.totalItems

        let totalQuantity = 0
        for (let i = 0; i < items.length; i++) {
            totalQuantity += items[i].quantity
        }

        data.totalQuantity = totalQuantity

        if (req.body.cancellable) {
            if (req.body.cancellable) {
                if (!/(?:true|false|True|False)/.test(req.body.cancellable)) return res.status(400).send({ status: false, message: `cancellable can't be ${isFreeShipping} ..! please add True or False` })
                data.cancellable = req.body.cancellable
            }
        } else {
            data.cancellable = true
        }

        data.status = 'pending'

        let empItems = {}
        empItems.items = []
        empItems.totalPrice = 0
        empItems.totalItems = 0

        const clrItems = await cartModel.findOneAndUpdate({ _id: cartData }, empItems, { new: true })

        const createOrderinDB = await orderModel.create(data)
        delete createOrderinDB._doc.deletedAt
        delete createOrderinDB._doc.isDeleted
        return res.status(201).send({ status: true, message: 'Success', data: createOrderinDB })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }

}

//=/=/=/=/=/=/=/=/=/=/=/=/=/=/======== updateOrder ========/=/=/=/=/=/=/=/=/

const updateOrder = async function (req, res) {

    try {
        let userId = req.params.userId
        console.log(userId)
        let data = req.body
        let { orderId, status } = data
        if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "please enter valid userId " })

        if (!Object.keys(data).length) return res.status(400).send({ status: false, message: "body is Required.." })

        const userdb = await userModel.findOne({ _id: userId })

        if (!userdb) return res.status(404).send({ status: false, message: "user is not present" })

        if (userId != req.userDetail) return res.status(403).send({ status: false, message: "user not Authorized to place order " })

        if (!orderId) return res.status(400).send({ status: false, message: "please enter orderId in body" })

        if (!mongoose.isValidObjectId(orderId)) return res.status(400).send({ status: false, message: "please enter valid OrderId " })
        if (!status) return res.status(400).send({ status: false, message: "Status is required.." })
        status = status.trim()
        if (!["completed", "cancled"].includes(status)) return res.status(400).send({ status: false, message: "choose one of these (completed or cancled)" })

        const orderdb = await orderModel.findOne({ _id: orderId })

        if (!orderdb) return res.status(404).send({ status: false, message: "order is  not present" })

        if (orderdb.status == "completed") return res.status(400).send({ status: false, message: "order is already completed,cannot update" })

        if (orderdb.status == "cancled") return res.status(400).send({ status: false, message: "order is already cancled,cannot update" })

        if (orderdb.userId.toString() != userId) return res.status(400).send({ status: false, message: "this order does'nt belong to this user" })

        if (orderdb.cancellable == false && status == "cancled") {

            return res.status(400).send({ status: false, message: "this order cannot be cancelled" })
        }
        else {
            const update = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status } }, { new: true })
            return res.status(200).send({ status: true, message: 'Success', data: update })
        }

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}


module.exports = {createOrder, updateOrder}















