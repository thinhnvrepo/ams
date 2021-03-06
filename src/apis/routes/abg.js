var express = require('express');
var router = express.Router();
var abgController = require('./../controllers/Abg');

/**
 * API keys and Passport configuration.
 */
const passport = require('./../../middleware/apiPassport');

router.get('/list', abgController.getList);
/* GET list building. */
router.get('/list-building/:abgId', abgController.getListBuilding);
/* POST submit data. */
router.post('/submit-data', passport.isAuthenticated, abgController.postSubmitData);

router.post('/add-new-building', passport.isAuthenticated, abgController.postAddNewBuilding);

module.exports = router;
