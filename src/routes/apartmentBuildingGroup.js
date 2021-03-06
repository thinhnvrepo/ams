var express = require('express');
var router = express.Router();
var abgController = require('./../controllers/ApartmentBuildingGroup');

/**
 * API keys and Passport configuration.
 */
const passport = require('./../middleware/passport');


/* GET abg listing. */
router.get('/', passport.isAuthenticated, abgController.getIndex);

/* GET import template file */
router.get('/import-template', passport.isAuthenticated, abgController.getImportTemplate);

router.get('/export-data', passport.isAuthenticated, abgController.getExportData);

/* API get create new abg */
router.get('/create', passport.isAuthenticated, abgController.getCreate);

/* API create new abg */
router.post('/create', passport.isAuthenticated, abgController.postCreate);

/* Get edit  */
router.get('/edit/:abgId', passport.isAuthenticated, abgController.getEdit);

/** Post update */
router.post('/update/:abgId', passport.isAuthenticated, abgController.postUpdate);

/* Get view */
router.get('/view/:abgId', passport.isAuthenticated, abgController.getView);

/* Get delete */
router.get('/delete/:abgId', passport.isAuthenticated, abgController.getDelete);

/* Get delete */
router.get('/delete-many/:abgIds', passport.isAuthenticated, abgController.getDeleteMany);

module.exports = router;
