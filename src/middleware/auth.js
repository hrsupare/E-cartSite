const jwt = require('jsonwebtoken')

const authenticate = async (req,res, next) => {
    const token = req.headers["x-Api-key"] || req.headers["x-api-key"]
    if(!token) return res.status(401).send({status:false , message : 'Token must be present in bearer token'})

    let decodedToken = jwt.verify(token , "project-5-team-work")

    req.userDetail = decodedToken
    next()

}

const autherisation = async (req, res, next) => {



}