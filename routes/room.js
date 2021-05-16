const express = require('express');
const router = express.Router();
const roomController= require('../controllers/roomController')
const roomValidator= require('../validators/roomValidator')


router.post('/create', roomValidator.create(),roomController.create);
router.patch('/joinRoom', roomController.joinRoom);
router.get('/myRoom', roomController.myRoom);

module.exports = router;
