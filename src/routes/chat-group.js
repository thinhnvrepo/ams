var express = require('express');
var router = express.Router();
var ChatGroupController = require('../controllers/ChatGroup');

/* get all categories. */
router.get('/', ChatGroupController.getIndex);
router.get('/add-black-list/:groupId', ChatGroupController.getAddBlackList);
router.get('/remove-black-list/:groupId', ChatGroupController.getRemoveBlackList);
router.get('/delete/:groupId', ChatGroupController.getDelete);
router.get('/edit/:groupId', ChatGroupController.getEdit);
router.post('/update/:groupId', ChatGroupController.postUpdate);

module.exports = router;
