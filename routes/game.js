const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController')


router.get('/situation', gameController.situation);
router.patch('/nightStart', gameController.startNight);
router.patch('/shot', gameController.shot);
router.patch('/doc', gameController.doc);
router.get('/detective', gameController.detective);

module.exports = router;
