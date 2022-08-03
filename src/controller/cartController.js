const cartModel = require("../model/cartModel");
const productModel = require("../model/productModel");
//const userModel = require("../model/userModel");
const mongoose = require("mongoose");

const createCart = async (req, res) => {
    // try {
        const userId = req.params.userId
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Please add The Valid userId" })
        }
        var data = req.body;
        if (!Object.keys(data).length) return res.status(400).send({ status: false, message: "body is Required.." })

        const uniqueUser = await cartModel.findOne({userId:userId})
        console.log(uniqueUser)
        if (uniqueUser.userId != userId){
            return res.status(404).send({ status: false, message: `Heeyyy... user! ${userId} this cartId is not belongs to Logged In user` })
        }
        if (uniqueUser) {
            console.log(uniqueUser)
            console.log(uniqueUser.items,uniqueUser.items.length)
           // if(uniqueUser.userId !==  userId) 
            let { productId, quantity, cartId } = data
           
            if (!cartId) return res.status(400).send({ status: false, message: "Please add cartId in reqbody as user have cart already" })
            if (!mongoose.isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, message: "Please add The Valid cartId" })
            }
            if (!mongoose.isValidObjectId(productId)) {
                return res.status(400).send({ status: false, message: "Please add The Valid productId" })
            }
            if(quantity){
                if (!/^([1-9]\d*)$/.test(quantity)) return res.status(400).send({ status: false, message: "enter valid quantity" })
            }else{
                quantity = 1
            }
            console.log(productId)
            if (productId) {
                for (let i = 0; i < uniqueUser.items.length; i++) {
                    console.log(productId )
                    console.log(uniqueUser.items[i].productId.toString())
                    if (productId == uniqueUser.items[i].productId.toString()) {
                        console.log(productId)
                        let products = await productModel.findOne({ _id: productId }, { isDeleted: false })
                        uniqueUser.items[i].quantity+=quantity
                        uniqueUser.totalPrice+= products.price*quantity
                        uniqueUser.totalItems =uniqueUser.items.length
                       
                        
                        const saveData = await cartModel.findOneAndUpdate({ _id: cartId }, uniqueUser, { new: true })
                        //console.log(saveData)
                       return res.status(200).send({ status: true, message: "product updated Successfully", data: saveData })
                    } else {
                        let products = await productModel.findOne({ _id: productId }, { isDeleted: false })
                        uniqueUser.totalPrice+= products.price*quantity
                        uniqueUser.totalItems =uniqueUser.items.length
                        uniqueUser.items.push({productId,quantity})

                        const saveData = await cartModel.findOneAndUpdate({ _id: cartId }, uniqueUser, { new: true })
                        //console.log(saveData)
                       return res.status(200).send({ status: true, message: "product updated Successfully", data: saveData })
                    }
                }
            }
        }
            else {
                let { productId, quantity } = data
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
        //  } 
        // catch (err) {
        //     res.status(500).send({ status: false, message: err.message })


        // }
    }
module.exports = { createCart }