const jwt = require('jsonwebtoken')


const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1] 
        //console.log(token)
        if(!token) return res.status(401).send({status:false , message : 'Token must be present in bearer token'})


        const decodedtoken = jwt.verify(token, "group71-project5");

        req.userDetail =decodedtoken;

        next()

    } catch (error) {
        if (error.message == "invalid token") return res.status(400).send({ status: false, message: "user has invalid token" })

        if (error.message == "invalid signature") return res.status(400).send({ status: false, message: "user has invalid token" })

        if (error.message == "jwt expired") return res.status(400).send({ status: false, message: "please login once more." })

        return res.status(500).send({ status: false, message: error.message })
    }
}


module.exports={authenticate}