const validator = require('./validator')
const { body } = require('express-validator');

class authValidator extends validator{
    login(){
        return[
            body('password', 'پسورد حداقل باید ۵ حرف باشد').isLength({min:5}),
            body('userName', 'این فیلد اجباریست').not().isEmpty(),
        ]
    }
    register(){
        return[
            body('password', 'پسورد حداقل باید ۵ حرف باشد').isLength({min:5}),
            body('userName', 'این فیلد اجباریست').not().isEmpty(),
        ]
    }
}

module.exports = new authValidator;
