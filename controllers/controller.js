const autoBind = require('auto-bind');

class Controller {
    constructor() {
        autoBind(this)
    }

    error(message, status= 500, messageType){
        let error = new Error((typeof message === 'object') ? 'بیش از یک خطا وجود دارد' : message )
        error.status = status;
        if(typeof message === 'object') error.data = message;
        throw error;
    }

    success(message, data, res,status= 200){
        res.status(status).json({
            success: true,
            message: message,
            data: data,
        })
    }

    showRoom(room){
        return{
            id: room._id,
            link: room.link,
            nightTime: room.nightTime,
            name: room.name,
            userNumbers: room.userNumbers,
        }
    }

    showUser(user, role= true){
        return {
            userName: user.userName,
            id: user.id,
            alive: user.alive,
            role: (role)?user.role:'نامشخص'
        }
    }
}

module.exports = Controller;
