var express = require('express');
var router = express.Router();
var abgController = require('./../controllers/ApartmentBuildingGroup');

/**
 * API keys and Passport configuration.
 */
const passport = require('./../middleware/apiPassport');


/* GET abg listing. */
router.get('/', abgController.getIndex);

/* API get create new abg */
router.get('/create-new', abgController.getCreateNew);

/* API create new abg */
router.post('/create-new', abgController.postCreateNew);


module.exports = router;