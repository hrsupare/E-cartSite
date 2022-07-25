const getUser = async function (req, res) {
    try {
      let userId = req.params
      console.log(params)
      const getUser = await userModel.findOne({id:userId})
  
      if (!getUser) {
        return res.status(404).send({ status: false, message: "no User found" }) 
      }
      res.status(200).send({ status: true,message:"User profile details", data: getUser })
  
    }
    catch (err) {
      console.log("This is the error :", err.message)
      res.status(500).send({ msg: "Error", error: err.message })
    }
  
  }