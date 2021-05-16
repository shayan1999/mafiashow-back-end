const express = require('express');
const router = express.Router();
const authValidator = require('../validators/authValidator')
const authController = require('../controllers/authController')

// router.get('/logout', async (req, res)=>{
//     console.log('hey')
// })

router.post('/login',  authValidator.login(), authController.login);
router.post('/register',  authValidator.register(), authController.register);

module.exports = router;
