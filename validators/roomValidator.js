const validator = require('./validator')
const { body } = require('express-validator');

class roomValidator extends validator{
    create(){
        return[
            body('userNumbers', 'تعداد بازیکنان').not().isEmpty(),
            body('name', 'نام فیلد اجباریست').not().isEmpty(),
            body('roles', 'نقش‌ها فیلد اجباریست').not().isEmpty(),
            body('nightTime', 'زمان شب فیلد اجباریست').not().isEmpty(),
            body('name', 'نام فیلد اجباریست').not().isEmpty(),
            body('name', 'نام فیلد اجباریست').not().isEmpty(),
            body('name', 'نام فیلد اجباریست').not().isEmpty(),
        ]
    }
}

module.exports = new roomValidator;
