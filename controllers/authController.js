const { validationResult } = require('express-validator');
let controller = require('./controller');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

class authController extends controller{

    async login(req, res, next){
        /*
        userName=> string
        password=> string
         */
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                let myErrors = errors.array().map((e)=> e.msg )
                this.error(myErrors, 402);
            }
            let user = await User.findOne({userName: req.body.userName});
            if(user){
                // user exists
                if(!bcrypt.compareSync(req.body.password, user.password)){
                    this.error('رمز عبور صحیح نمیباشد', 401);
                }
                let newUser = {
                    userName: user.userName,
                    id: user._id,
                }
                const accessToken= this.generateAccessToken(newUser);
                this.success('وارد شدید', {accessToken: accessToken, login: true, room: user.room}, res);
            }else{
                this.error('کاربر موجود نمیباشد', 404);
            }
        }catch (e) {
            next(e);
        }
    }

    async register(req, res, next){
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                let myErrors = errors.array().map((e)=> e.msg )
                this.error(myErrors, 402);
            }
            let user = await User.findOne({userName: req.body.userName});
            if(user){
                this.error('این نام کاربری موجود میباشد', 409);
            }else{
                const hash = bcrypt.hashSync(req.body.password, 10);
                console.log(hash)
                let newUser= new User({
                    userName: req.body.userName,
                    password: hash,
                    room: null
                });
                let accessToken = null;
                await newUser.save().then(async result =>{
                    console.log(result);
                    accessToken= this.generateAccessToken({userName: req.body.userName, id: result._id});
                    return this.success('با موفقیت ساخته شد', {accessToken, login: false}, res, 201);
                })
            }
        }catch (e) {
            next(e);
        }
    }

    generateAccessToken(user){
        return jwt.sign(user, config.ACCESS_TOKEN_SECRET, {expiresIn: 60*60*24*120});
    }
}

module.exports = new authController();
