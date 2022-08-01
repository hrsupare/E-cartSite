const jwt = require('jsonwebtoken')


const authenticate = async (req, res, next) => {
    try {
        let token = req.headers.authorization
        console.log(token)

        if (token == 'Bearer null') return res.status(401).send({status:false , message : 'Token must be present in bearer token'})
        let Bearer = token.split(' ')
        const decodedtoken = jwt.verify(Bearer[1], "group71-project5");

        req.userDetail =decodedtoken;

        next()

    } catch (error) {
        if (error.message == "invalid token") return res.status(400).send({ status: false, message: "user has invalid token" })
        if (error.message == "jwt expired") return res.status(400).send({ status: false, message: "please login once more." })
       if (error.message == "jwt malformed") return res.status(401).send({ status: false, message: "please enter valid token." })
       if( error.message ==  'jwt must be provided')  return res.status(400).send({ status: false, message: "please enter valid token." })

        return res.status(500).send({ status: false, message: error.message })
    }


   
  
}


module.exports={authenticate}