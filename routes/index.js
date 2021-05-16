const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken')

router.use(`${config.BaseUrl}/auth`, require('./auth'));

router.use((req, res, next) =>{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(!token) return res.sendStatus(401);
    jwt.verify(token, config.ACCESS_TOKEN_SECRET, (err, user)=>{
        if(err) return res.sendStatus(403);
        req.user = user;
        next();
    })
})

router.use(`${config.BaseUrl}/room`, require('./room'));
router.use(`${config.BaseUrl}/game`, require('./game'));

router.all('*', async (req, res, next)=>{
    try {
        let error = new Error('صفحه‌ای یافت نشد')
        error.status = 404;
        throw error;
    }catch (e) {
        next(e)
    }
})

router.use(async (error, req, res, next)=>{
    const code = error.status || 500;
    const message = error.message || 'ارور سمت سرور';
    const stack = error.stack || '';
    const data = error.data || null

    return res.status(code).json({
        message: message,
        status: code,
        stack:(code === 500) ? stack : null,
        data: (data) ? data : null,
        success: false
    })
})


module.exports = router;
