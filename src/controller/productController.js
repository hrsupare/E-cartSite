const productModel = require("../model/productModel")
const mongoose = require("mongoose");
const aws = require("aws-sdk");

//=/=/=/=/=/=/=  AWS (Connection & uplode Function) =/=/=/=/=/=/=/=/=/=/=/=/

aws.config.update({
    accessKeyId: "AKIAY3L35MCRVFM24Q7U",
    secretAccessKey: "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",
    region: "ap-south-1"
})

let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {
        // this function will upload file to aws and return the link
        let s3 = new aws.S3({ apiVersion: '2006-03-01' }); // we will be using the s3 service of aws

        var uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",  //HERE
            Key: "abc/" + file.originalname, //HERE 
            Body: file.buffer
        }

        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err })
            }
            console.log("file uploaded succesfully")
            return resolve(data.Location)
        })
    })
}


//=/=/=/=/=/=/=/=/=/=/=/ =/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/ 

const isValidData = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length == 0) return false;
    return true;
};


//=/=/=/=/=/=/=/=/=/=/=/=/=/=/= createProduct =/=/=/=/=/=/=/=/=/

const createProduct = async (req, res) => {

    try {
        const data = req.body
        let files = req.files

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data

        if (!Object.keys(data).length) return res.status(400).send({ status: false, message: "body is Required.." })


        if (!isValidData(title)) return res.status(400).send({ status: false, message: "title is Required.." })

        if (!/^(?=.*?[a-zA-Z])[,.! %?a-zA-Z\d ]+$/.test(title)) return res.status(400).send({ status: false, msg: `title is not a valid it can be aphaNumeric` });

        let title1 = title.trim().split(" ").filter((word) => word).join(" ");

        let uniqueTitle = await productModel.findOne({ title: title1 })
        if (uniqueTitle) return res.status(400).send({ status: false, message: ` ${title1} is Already Exist ` })

        data.title = title.trim().split(" ").filter((word) => word).join(" ");

        if (!isValidData(description)) return res.status(400).send({ status: false, message: "description is Required.." })

        if (!/^(?=.*?[a-zA-Z])[,.! %?a-zA-Z\d ]+$/.test(description)) return res.status(400).send({ status: false, message: "description is not Valid." })

        data.description = description.trim().split(" ").filter((word) => word).join(" ");

        if (!price || price.trim().length == 0) return res.status(400).send({ status: false, message: " Price is Required.." })

        if (!/^[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)$/.test(price)) return res.status(400).send({ status: false, message: " Price is in this Format 200 || 200.00" })

        if (Number(price) <= 0) return res.status(400).send({ status: false, message: " Price is not less than 0 " })

        if (currencyId) {

            if (currencyId.trim().length == 0) return res.status(400).send({ status: false, message: " currencyId is Required.." })

            if (currencyId.toUpperCase() != "INR") return res.status(400).send({ status: false, message: " currencyId is only INR" })
            data.currencyId = currencyId.toUpperCase()
        }
        if (!currencyId) {
            data.currencyId = "INR"
        }
        //---------  currencyFormat-------       
        if (currencyFormat) {
            if (currencyFormat.trim().length == 0) return res.status(400).send({ status: false, message: " currencyFormat is Required.." })

            if (currencyFormat != "₹") return res.status(400).send({ status: false, message: " currencyFormatis only ₹" })
        }
        if (!currencyFormat) {
            data.currencyFormat = "₹"
        }


        if (isFreeShipping == 0) return res.status(400).send({ status: false, message: "isFreeShipping Box can't be empty..! please add True or False" })

        if (isFreeShipping) {
            if (!/(?:true|false|True|False)/.test(isFreeShipping)) return res.status(400).send({ status: false, message: `isFreeShipping can't be ${isFreeShipping} ..! please add True or False` })
            data.isFreeShipping = isFreeShipping.toLowerCase()
        }

        let fileData = files[0];
        if (!fileData) { return res.status(400).send({ msg: "Product Image Not found" }); }
        if (!/([/|.|\w|\s|-])*\.(?:jpg|jpeg|png|JPG|JPEG|PNG)/.test(fileData.originalname)) {
            return res
                .status(400)
                .send({ status: false, msg: "productImage is valid only in JPG JPEG PNG." });
        }
        if (files && files.length > 0) {
            let uploadedFileURL = await uploadFile(files[0]);
            data.productImage = uploadedFileURL;
        } else {
            return res.status(400).send({ msg: "Product Image Not found" });
        }

        if (style == 0) return res.status(400).send({ status: false, message: "style can't be empty..! please add style" })

        if (style) {
            if (!/^\s*[a-zA-Z ]{2,}\s*$/.test(style)) return res.status(400).send({ status: false, message: " Style is not valid " })
            data.style = style.trim().split(" ").filter((word) => word).join(" ");
        }

        if (availableSizes == 0) { return res.status(400).send({ status: false, msg: "AvailableSizes should not be empty" }) }

        if (availableSizes) {
            data.availableSizes = availableSizes.toUpperCase()
            let check = data.availableSizes.split(" ")

            for (let i = 0; i < check.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(check[i]))) {
                    return res.status(400).send({ status: false, message: `the Size which you given ${check[i]} is not valid please enter valid Size` })
                }
            }
            data.availableSizes = data.availableSizes.split(" ")
        }

        if (installments == 0) return res.status(400).send({ status: false, message: " Installments is empty" })

        if (installments) {
            if ((Number(installments)) > Number(price)) return res.status(400).send({ status: false, message: " installments Should be less than price" })
            if (Number(installments) < 0) return res.status(400).send({ status: false, message: " Installments is not less than 0 " })

            if (!Number.isInteger(Number(installments))) {
                return res.status(400).send({ status: false, message: "Plz, enter valid format of installments it should be a integer" })
            }

        }

        const saveData = await productModel.create(data)
        res.status(201).send({ status: true, message: "Success", data: saveData })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}


//=/=/=/=/=/=/=/=/=/=/=/=/=/=/= getproductbyfilter =/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/

const getproductbyfilter = async function (req, res) {
    try {

        let requestData = req.query
        console.log(requestData);

        const { size, name, priceGreaterThan, priceLessThan, pricesort } = requestData

        //<----------------------- taking filter for searching (Size) ------------------>//
        const filter = {}
        if (size) {
            let sizeAll = JSON.parse(size)
            console.log(sizeAll)
            let sizes = sizeAll.map(x => x.toUpperCase());
            if (sizes) {

                for (let i = 0; i < sizes.length; i++) {
                    if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizes[i]))) {
                        return res.status(400).send({ status: false, message: `${sizes[i]} is NOT valid Size, Available Sizes must be among ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
                    }
                }

                if (sizes.length > 0) {
                    let arrSize = [...sizes]
                    console.log(arrSize)
                    filter.availableSizes = { $in: arrSize }
                }
            }
        }
        //<----------------------- taking filter for searching (name) ------------------>//
        console.log(name)
        if (name) {
            if (!/^(?=.*?[a-zA-Z])[,.! %?a-zA-Z\d ]+$/.test(name)) return res.status(400).send({ status: false, message: "enter valid name" })
            console.log(name)
            // filter.title = name
            filter.title = { $regex: name }
        }

        //<----------------------- taking filter for searching (price) ------------------>//
        if (priceGreaterThan == 0) return res.status(400).send({ status: false, message: "enter valid price" })
        if (priceGreaterThan) {
            if (!/^(0|[1-9]\d*)$/.test(priceGreaterThan)) return res.status(400).send({ status: false, message: "enter valid price" })
            filter.price = { $gt: priceGreaterThan }
        }
        if (priceLessThan == 0) return res.status(400).send({ status: false, message: "enter valid price" })
        if (priceLessThan) {
            if (!/^(0|[1-9]\d*)$/.test(priceLessThan)) return res.status(400).send({ status: false, message: "enter valid price" })
            filter.price = { $lt: priceLessThan }
        }
        if (priceGreaterThan && priceLessThan) {
            filter.price = { $gte: priceGreaterThan, $lte: priceLessThan }
        }
        if (!(pricesort == 1 || pricesort == -1)) {
            return res.status(400).send({ status: false, message: "pricesort should be 1 and -1" })
        }

        console.log(filter)

        let allproduct = await productModel.find({ $and: [{ isDeleted: false }, filter] }).sort({ price: pricesort })

        if (allproduct.length == 0)
            return res.status(404).send({ status: false, message: "product not found" })

        res.status(200).send({ status: true, message: 'Success', data: allproduct })
    }
    catch (err) {
        if (err.message == "Unexpected end of JSON input") return res.status(400).send({ status: false, message: `add the size element in ["M"] || ["S", "XS", "M"]` })
        res.status(500).send({ status: false, message: err.message })

    }
}

//=/=/=/=/=/=/=/=/=/=/=/=/=/=/= getProductById =/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/

const getProductById = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Please enter the Valid productId" })
        }

        const findInDB = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!findInDB) {
            return res.status(404).send({ status: false, message: "product is not available" })
        }

        if (findInDB.isDeleted == false) {
            findInDB.deletedAt = null;
        }

        return res.status(200).send({ status: true, message: 'Success', data: findInDB })

    } catch (err) {
        console.log("This is the error :", err.message);
        res.status(500).send({ msg: "Error", error: err.message });
    }

}

//=/=/=/=/=/=/=/=/=/=/=/=/=/=/= updateProductDetail =/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/

const updateProductDetail = async function (req, res) {

    try {
        const updatedData = req.body
        const productId = req.params.productId
        let files = req.files;

        if(Object.keys(updatedData).length == 0) return res.status(400).send({ status: false, message: 'select some key for updation' })

        if (!mongoose.isValidObjectId(productId)) return res.status(400).send({ status: false, message: 'productId is not valid' })

        const checkProduct = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!checkProduct) { return res.status(404).send({ status: false, message: "product not found" }) }

        if (!updatedData) { return res.status(400).send({ status: false, message: "Put something what you want to update." }) }

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = updatedData
        //-------validate titel -------
        if (title == 0) return res.status(400).send({ status: false, msg: "title should not be empty" })

        if (title) {
            if (!/^(?=.*?[a-zA-Z])[,.! %?a-zA-Z\d ]+$/.test(title)) {
                return res.status(400).send({ status: false, msg: `Heyyy....! ${title} is not a valid title It Should Alpha || Alphanumeric` });
            }

            let title1 = title.trim().split(" ").filter((word) => word).join(" ");
            const checkTitle = await productModel.findOne({ title: title1 });

            if (checkTitle)  return res.status(400).send({ status: false, message: ` Title is already present` })
            
            updatedData.title = title.trim().split(" ").filter((word) => word).join(" ");
        }

        //------- description-------
        if (description == 0) return res.status(400).send({ status: false, msg: "description should not be empty" })
        if (description) {

            if (!/^(?=.*?[a-zA-Z])[. %?a-zA-Z\d ]+$/.test(description)) {
                return res.status(400).send({ status: false, msg: `Description is not valid ` });
            }
            updatedData.description = description.trim().split(" ").filter((word) => word).join(" ");
        }

        //------- Validate price-------

        if (price == 0) return res.status(400).send({ status: false, msg: "price should not be empty" })
        if (price) {
            if (isNaN(Number(price))) {
                return res.status(400).send({ status: false, message: `Price should be a valid number` })
            }
            if (price <= 0) {
                return res.status(400).send({ status: false, message: `Price should be a valid number` })
            }
        }

        //-------  currencyId------
        if (currencyId) {
            if (currencyId != "INR") {
                return res.status(400).send({ status: false, message: 'currencyId should be a INR' })
            }
        }

        //---------  currencyFormat-------   
        if (currencyFormat) {
            if (currencyFormat != "₹") {
                return res.status(400).send({ status: false, message: "Please provide currencyFormat in format ₹ only" })
            }
        }

        //---------  isFreeShipping------- 
        if (isFreeShipping == 0) return res.status(400).send({ status: false, msg: "isFreeShipping should not be empty" })
        if (isFreeShipping) {
            if (!((isFreeShipping === "true") || (isFreeShipping === "false"))) {
                return res.status(400).send({ status: false, message: 'isFreeShipping should be a boolean value' })
            }
        }
        //---------  validate ProductImage-------

        let fileData = files[0];
        if (fileData) {

            if (!/([/|.|\w|\s|-])*\.(?:jpg|jpeg|png|JPG|JPEG|PNG)/.test(fileData.originalname)) return res.status(400).send({ status: false, message: " productImage is not in right format .." })

            if (files && files.length > 0) {
                let uploadedFileURL = await uploadFile(files[0]);
                updatedData.productImage = uploadedFileURL;
            }
        }

        //---------  style-------  
        if (style == 0) return res.status(400).send({ status: false, msg: "style should not be empty" })
        if (style) {
            if (!/^(?=.*?[a-zA-Z])[. %?a-zA-Z\d ]+$/.test(style)) {
                return res.status(400).send({ status: false, msg: `style is not valid ` });
            }
            updatedData.style = style.trim().split(" ").filter((word) => word).join(" ");
        }
        // //---------  availableSizes------- 

        if (availableSizes == 0) { return res.status(400).send({ status: false, msg: "availableSizes should not be empty" }) }
        if (availableSizes) {
            updatedData.availableSizes = availableSizes.toUpperCase()
            let check = updatedData.availableSizes.split(" ")
            // console.log(checkProduct.availableSizes);
            for (let i = 0; i < check.length; i++) {

                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(check[i]))) {
                    {
                        return res.status(400).send({ status: false, message: `the Size which you given ${check[i]} is not valid plsase enter valid Size` })
                    }

                }
            }

            updatedData.availableSizes = updatedData.availableSizes.split(" ")
        }

        //---------  installments-------        
        if (installments == 0) return res.status(400).send({ status: false, msg: "installments should not be empty" })
        if (installments) {
            if (!Number.isInteger(Number(installments))) {
                return res.status(400).send({ status: false, message:"Plz, enter valid format of installments it should be a integer" })
            }
            if (Number(installments) < 0) return res.status(400).send({ status: false, message: " Installments is not less than 0 " })
            if (price) {
                if (Number(installments) > Number(price)) {
                    return res.status(400).send({ status: false, message: `installments should not be greater then the price` })
                }
            } else {
                if ((Number(installments) > checkProduct.price)) {
                    return res.status(400).send({ status: false, message: `installments should not be greater then the price` })
                }
            }
        }

        const updatedProduct = await productModel.findOneAndUpdate({ _id: productId }, updatedData, { new: true })
        res.status(200).send({ status: true, message: 'Product details updated successfully.', data: updatedProduct });

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}




//=/=/=/=/=/=/=/=/=/=/=/=/=/=/= deleteProductById =/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/

const deleteProductById = async function (req, res) {

    try {
        const productId = req.params.productId

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Please enter The Valid productId" })
        }

        const findInDB = await productModel.findById(productId)
        if (!findInDB) {
            return res.status(404).send({ status: false, message: "No such Product with that productId" })
        }
        if (findInDB.isDeleted == true) {
            return res.status(400).send({ status: false, message: "This Product Is already removed" })
        }
        const deleteInDB = await productModel.findByIdAndUpdate({ _id: productId }, { isDeleted: true, deletedAt: Date.now() }, { new: true })
        return res.status(200).send({ status: true, message: "Product removed successfully" })
    } catch (err) {
        console.log("This is the error :", err.message);
        res.status(500).send({ msg: "Error", error: err.message });
    }
}
module.exports = { getproductbyfilter, createProduct, getProductById, deleteProductById, updateProductDetail }


