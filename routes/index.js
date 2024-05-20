const express = require('express');
const router = express.Router();
const listController = require('../controller/listController');
const { sendEmailToList } = require('../controller/emailController');

router.post('/lists', listController.createList);
router.post('/lists/:listId/users/upload', listController.upload.single('file'), listController.uploadUsers);
router.post('/lists/:listId/send-email', sendEmailToList);
router.get('/unsubscribe', listController.unsubscribeUser);
module.exports = router;
