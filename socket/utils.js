const jwt = require('jsonwebtoken')

const showRoom=(room)=>{
    return{
        id: room._id,
        link: room.link,
        nightTime: room.nightTime,
        name: room.name,
        userNumbers: room.userNumbers,
    }
}

const showUser= (user, role= true)=>{
    return {
        userName: user.userName,
        id: user.id,
        alive: user.alive,
        role: (role)?user.role:'نامشخص'
    }
}

const error=(message, status= 500, data= null)=>{
    return{
        message: message,
        status: status,
        data: data,
        success: false
    }
}

const success= (message, data= null, status= 200)=>{
    return{
        message: message,
        data: data,
        status: status,
        success: true
    }
}

const checkJwt=async (token)=>{
    try {
        if (!token) {
            return {
                error: error('یوزر موجود نیست', 401),
                success: false
            }
        }
        return  await jwt.verify(token, config.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                return {
                    error: error('authorization failed', 403),
                    success: false
                }
            }
            return {
                success: true,
                user: user
            }
        })
    }catch (e) {
        return {
            success: false,
            error: error('', 500)
        }
    }
}

module.exports= {success, error, showRoom, showUser, checkJwt}
