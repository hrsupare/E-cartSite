const aws = require("aws-sdk");
const bcrypt = require('bcrypt');
const userModel = require("../model/userModel");
const jwt = require('jsonwebtoken')
const mongoose = require("mongoose");

//=/=/=/=/=/=/=  AWS (Connection & uplode Function) =/=/=/=/=/=/=/=/=/=/=/=/

aws.config.update({
  accessKeyId: "AKIAY3L35MCRVFM24Q7U",
  secretAccessKey: "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",
  region: "ap-south-1",
});

let uploadFile = async (file) => {
  return new Promise(function (resolve, reject) {
    let s3 = new aws.S3({ apiVersion: "2006-03-01" }); // we will be using the s3 service of aws

    var uploadParams = {
      ACL: "public-read",
      Bucket: "classroom-training-bucket", //HERE
      Key: "abc/" + file.originalname, //HERE
      Body: file.buffer,
    };

    s3.upload(uploadParams, function (err, data) {
      if (err) {
        return reject({ error: err });
      }
      // console.log(data)
      console.log("file uploaded succesfully");
      return resolve(data.Location);
    });
  });
};

const isValidRequestBody = function (requestBody) {
  if (!requestBody) return false;
  if (Object.keys(requestBody).length == 0) return false;
  return true;
};

const isValidData = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length == 0) return false;
  return true;
};


//============================================= create user =====================================//


const createUser = async function (req, res) {
  try {
    let data = req.body;

    const { fname, lname, email, phone, password } = data;

    let files = req.files;
    //===== validate body ======//
    if (!isValidRequestBody(data)) {
      return res
        .status(400)
        .send({ status: false, message: "Body cannot be empty" });
    }

    //===== validate fname ======//
    if (!isValidData(fname)) {
      return res
        .status(400)
        .send({ status: false, message: "please enter your first Name" });
    }
    if (!/^\s*[a-zA-Z ]{2,}\s*$/.test(fname)) {
      return res.status(400).send({
        status: false,
        message: `Heyyy....! ${fname} is not a valid first name`,
      });
    }
    data.fname = fname.trim().split(" ").filter((word) => word).join(" ");

    //===== validate  lname  ======//
    if (!isValidData(lname)) {
      return res
        .status(400)
        .send({ status: false, message: "please enter your last Name" });
    }
    if (!/^\s*[a-zA-Z ]{2,}\s*$/.test(lname)) {
      return res.status(400).send({
        status: false,
        message: `Heyyy....! ${lname} is not a valid  last name`,
      });
    }
    data.lname = lname.trim().split(" ").filter((word) => word).join(" ");

    //===== validate email ======//
    if (!isValidData(email)) {
      return res.status(400).send({ status: false, message: "please enter email" });
    }
    if (!/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(email)) {
      return res.status(400).send({ status: false, message: `Heyyy....! ${email} is not a valid email` });
    }

    let checkEmail = await userModel.findOne({ email: email });
    if (checkEmail) {
      return res
        .status(400)
        .send({
          status: false,
          message: `Heyyy....! there already exists an account registered with ${email} email address`,
        });
    }

    data.email = email.trim();

    //===== validate and uplode profile photo ======//
    let fileData = files[0];
    console.log(fileData)
    if (files.length == 0) {
      return res.status(400).send({ message: "No Profile image found" });
    }

    if (!/([/|.|\w|\s|-])*\.(?:jpg|jpeg|png|JPG|JPEG|PNG)/.test(fileData.originalname)) {
      return res
        .status(400)
        .send({ status: false, message: "please Add your profile Image with a valid only in JPG JPEG PNG." });
    }

    if (files && files.length > 0) {
      let uploadedFileURL = await uploadFile(files[0]);
      data.profileImage = uploadedFileURL;
    }

    //===== validate phone ======//
    if (!isValidData(phone)) {
      return res
        .status(400)
        .send({ status: false, message: "please enter your mobile number" });
    }
    if (!/^\s*(?=[6789])[0-9]{10}\s*$/.test(phone)) {
      return res
        .status(400)
        .send({
          status: false,
          message: `Heyyy....! ${phone} is not a valid phone`,
        });
    }
    let checkPhone = await userModel.findOne({ phone: phone });
    if (checkPhone) {
      return res
        .status(400)
        .send({
          status: false,
          message: `Heyyy....! there already exists an account registered with ${phone} phone`,
        });
    }

    data.phone = phone.trim();

    //===== validate and hash password ======//
    if (!isValidData(password)) {
      return res.status(400).send({
        status: false,
        message: "please enter Password....!",
      });
    }
    if (!/^[a-zA-Z0-9@*&$#!]{8,15}$/.test(password)) {
      return res.status(400).send({
        status: false,
        message: "please enter valid password min 8 or max 15 digit",
      });
    }
    //hashing
    const saltRounds = 10;
    const hash = bcrypt.hashSync(password, saltRounds);
    data.password = hash;

    //===== validate address ======//
    try {
      data.address = JSON.parse(data.address);
    } catch {
      return res.status(400).send({ msg: "please enter  valid details || valid pincode" });
    }

    if (!data.address) {
      return res
        .status(400)
        .send({ status: false, msg: "please add address details" });
    }
    if (!data.address.shipping) {
      return res
        .status(400)
        .send({ status: false, msg: "please add shipping details" });
    }
    if (
      !isValidData(data.address.shipping.street) ||
      !/^\s*[a-zA-Z0-9 .,-:]{2,}\s*$/.test(
        data.address.shipping.street
      )
    ) {
      return res
        .status(400)
        .send({ status: false, msg: "please add valid shipping street" });
    }

    if (
      !isValidData(data.address.shipping.city) ||
      !/^([a-zA-Z\.]+)$/.test(data.address.shipping.city)
    ) {
      return res
        .status(400)
        .send({ status: false, msg: "please add valid shipping city" });
    }

    if (
      !isValidData(data.address.shipping.pincode) ||
      !/^[1-9]{1}[0-9]{2}[0-9]{3}$/.test(data.address.shipping.pincode)
    ) {
      return res
        .status(400)
        .send({ status: false, msg: "please add valid shipping pincode" });
    }

    if (!data.address.billing) {
      return res
        .status(400)
        .send({ status: false, msg: "please add billing details  " });
    }
    if (
      !isValidData(data.address.billing.street) ||
      !/^\s*[a-zA-Z0-9 .,-:]{2,}\s*$/.test(
        data.address.billing.street
      )
    ) {
      return res
        .status(400)
        .send({ status: false, msg: "please add valid billing street" });
    }

    if (
      !isValidData(data.address.billing.city) ||
      !/^([a-zA-Z]+)$/.test(data.address.billing.city)
    ) {
      return res
        .status(400)
        .send({ status: false, msg: "please add valid billing city" });
    }

    if (
      !isValidData(data.address.billing.pincode) ||
      !/^[1-9]{1}[0-9]{2}[0-9]{3}$/.test(data.address.billing.pincode)
    ) {
      return res
        .status(400)
        .send({ status: false, msg: "please add valid billing pincode" });
    }
    //===== create user ======//
    let createUserDoc = await userModel.create(data);
    return res.status(201).send({
      status: true,
      message: "User created Successfully",
      data: createUserDoc,
    });
  } catch (err) {
    console.log("This is the error :", err.message);
    res.status(500).send({ message: "Error", error: err.message });
  }
};

//==========================================login user=====================================//

let loginUser = async function (req, res) {
  try {
    let data = req.body;
    const email1 = data.email;
    const password1 = data.password;

    if (Object.keys(data).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide details in body" });
    }
    if (!email1 || email1.trim().length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide Email" });
    }
    if (!password1 || password1.trim().length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide Password" });
    }
    if (!/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(email1)) {
      return res.status(400).send({
        status: false,
        message: "Email should be valid email address",
      });
    }
    if (!/^.{8,15}$/.test(password1)) {
      return res.status(400).send({
        status: false,
        message: "password length should be in between 8 to 15",
      });
    }

    let userData = await userModel.findOne({ email: email1 });
    console.log(userData)
    if (!userData) {
      return res.status(400).send({
        status: false,
        message: "Email or the Password doesn't match",
      });
    }

    const checkPassword = await bcrypt.compare(password1, userData.password)

    if (!checkPassword) return res.status(401).send({ status: false, message: `Login failed!! password is incorrect.` });
    let userId = userData._id
    let token = jwt.sign(
      {
        userId: userId,
        project: "Products Management",
      }, "group71-project5", { expiresIn: '7d' },

    );

    {
      res.status(200).send({ status: true, message: "User login successfull", data: { userId: userId, Token: token } });
    }
  } catch (err) {
    res.status(500).send({ status: false, error: err.message });
  }
};

const isValidObjectId = function (objectId) {
  if (mongoose.Types.ObjectId.isValid(objectId)) return true;
  return false;
}

//============================================= get user =====================================//

const getUser = async function (req, res) {
  try {
    let userId = req.params.userId
    if (!isValidObjectId(userId)) {
      return res.status(400).send({ status: false, message: " enter valid UserId" });
    }

    if (userId != req.userDetail)
      return res.status(403).send({ status: false, message: "Not Authourised" })

    const getUser = await userModel.findOne({ _id: userId })

    if (!getUser) {
      return res.status(404).send({ status: false, message: "no User found" })
    }
    res.status(200).send({ status: true, message: "User profile details", data: getUser })

  }
  catch (err) {
    console.log("This is the error :", err.message)
    res.status(500).send({ message: "Error", error: err.message })
  }

}


//=============================================  update user =====================================//

const updateUserDetail = async (req, res) => {

  try {

    const userId = req.params.userId
    var data = req.body
    const files = req.files;

    if (files && files.length > 0) {
      let uploadedFileURL = await uploadFile(files[0]);
      data.profileImage = uploadedFileURL;
    }
    let { fname, lname, email, profileImage, phone, password, address } = data

    if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: 'UserId is not valid' })

    const findUser = await userModel.findOne({ _id: userId })  //doubt
    if (!findUser) return res.status(404).send({ status: false, message: 'User not found' })


    //----------authorisation---------------------------------------------

    if (userId != req.userDetail)
      return res.status(403).send({ status: false, message: "Not Authourised" })
    //-----------------------------------------------------------------

    if (fname == 0) return res.status(400).send({ status: false, message: "fname is empty" })
    if (fname) {
      if (!/^\s*[a-zA-Z]{2,}\s*$/.test(fname)) {
        return res.status(400).send({ status: false, message: `Heyyy....! ${fname} is not a valid first name` });
      }
    }
    if (lname == 0) return res.status(400).send({ status: false, message: "lname is empty" })
    if (lname) {
      if (!/^\s*[a-zA-Z]{2,}\s*$/.test(lname)) {
        return res.status(400).send({ status: false, message: `Heyyy....! ${lname} is not a valid last name` });
      }

    }
    if (email == 0) return res.status(400).send({ status: false, message: "email is empty" })
    if (email) {
      if (!/[a-z0-9]+@[a-z]+\.[a-z]{2,3}/.test(email)) return res.status(400).send({ status: false, message: "email is not valid.." })
    }

    let findEmail = await userModel.findOne({ email: email })
    if (findEmail) return res.status(400).send({ status: false, message: "Email already exist.." })
    if (phone == 0) return res.status(400).send({ status: false, message: "phone is empty" })
    if (phone) {
      if (!/^\s*(?=[6789])[0-9]{10}\s*$/.test(phone)) return res.status(400).send({ status: false, message: "number is inValid .." })
    }
    let findphone = await userModel.findOne({ phone: phone })
    console.log(findphone);
    if (findphone) return res.status(400).send({ status: false, message: "Phone Number already exist.." })

    if (profileImage) {
      if (!/([/|.|\w|\s|-])*\.(?:jpg|jpeg|png|JPG|JPEG|PNG)/.test(profileImage)) return res.status(400).send({ status: false, message: " profileImage .." })
    }
    if (password == 0) return res.status(400).send({ status: false, message: "password is empty" })
    if (password) {
      if (!/^[a-zA-Z0-9@*&$#!]{8,15}$/.test(password)) {
        return res.status(400).send({ status: false, message: "password length should be in between 8 to 15" });
      }
      //hashing
      const saltRounds = 10;
      const hash = bcrypt.hashSync(password, saltRounds);
      data.password = hash;
    }

    if (address == 0) return res.status(400).send({ status: false, message: "address is empty" })
    if (address) {
      try {
        data.address = JSON.parse(data.address);
      } catch {
        return res.status(400).send({ msg: "please enter Valid pincode" });
      }
      address = JSON.parse(address)
      if (!address.shipping) {
        return res.status(400).send({ status: false, msg: "please add shipping details" });
      }
      if (!isValidData(address.shipping.street) || !/^([a-zA-Z 0-9\S]+)$/.test(address.shipping.street)
      ) { return res.status(400).send({ status: false, message: "please add valid shipping street" }); }


      if (!isValidData(address.shipping.city) || !/^([a-zA-Z]+)$/.test(address.shipping.city)
      ) { return res.status(400).send({ status: false, message: "please add valid shipping city" }); }

      if (!/^[1-9]{1}[0-9]{2}[0-9]{3}$/.test(address.shipping.pincode)
      ) { return res.status(400).send({ status: false, message: "please add valid shipping pincode" }); }
      
      if (!address.billing) {
        return res.status(400).send({ status: false, msg: "please add billing details  " });
      }
      if (!isValidData(address.billing.street) || !/^([a-zA-Z 0-9\S]+)$/.test(address.billing.street)
      ) { return res.status(400).send({ status: false, message: "please add valid billing street" }); }

      if (!isValidData(address.billing.city) || !/^([a-zA-Z]+)$/.test(address.billing.city)
      ) {
        return res.status(400).send({ status: false, message: "please add valid billing city" });
      }

      if (!/^[1-9]{1}[0-9]{2}[0-9]{3}$/.test(address.billing.pincode)
      ) {
        return res.status(400).send({ status: false, message: "please add valid billing pincode" });
      }
    }

    data.address = address

    let up = await userModel.findOneAndUpdate({ _id: userId }, data, { new: true })
    res.status(200).send({ status: true, message: "user updated",data:up })
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }

}

module.exports = { getUser, createUser, loginUser, updateUserDetail }