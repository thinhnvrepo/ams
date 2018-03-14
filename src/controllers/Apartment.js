const ApartmentBuilding = require('../models/ApartmentBuilding');
const ApartmentBuildingGroup = require('../models/ApartmentBuildingGroup');
const User = require('../models/User');
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);

// Get all apartment building
exports.getIndex = function (req, res, next) {
	client.get('get_list_abs', (err, abs) => {
		if (err) {
			console.log('err', err);
			throw err;
		}
		if (abs && process.env.CACHE_ENABLE == 1) {
			console.log('cache_enable', process.env.CACHE_ENABLE);
			res.render('apartment/index', {
				title: 'Danh sách tòa nhà',
				current: ['apartment-building', 'index'],
				data: JSON.parse(abs)
			});
		} else {
			ApartmentBuilding.find({})
				.populate('manager', {
					'_id': 1,
					'userName': 1
                })
                // .populate('apartments', {
                //     '_id': 1
                // })
                .populate('apartmentBuildingGroup', {
					'_id': 1,
					'abgName': 1
                })
				.populate('createdBy', {
					'_id': 0,
					'userName': 1
				})
				.exec(function (err, abs) {
					if (err) {
						console.log('err', err)
						return next(err);
					}

					res.render('apartment-building/index', {
						title: 'Danh sách tòa nhà',
						current: ['apartment-building', 'index'],
						data: abs
					});

					/**
					 * Set redis cache data
					 */
					client.set('get_list_abs', JSON.stringify(abs));
				});
		}
	});
}

exports.getCreate = (req, res, next) => {
	ApartmentBuildingGroup.find({}, (err, abgs) => {
		User.find({}, (err, users) => {
			res.render('apartment/create', {
				title: 'Thêm căn hộ',
				current: ['apartment', 'create'],
				users: users,
				abgs: abgs
			});
		});
	});
}

exports.postCreate = (req, res, next) => {
	req.checkBody('buildingName', 'Tên tòa nhà không được để trống').notEmpty();
	req.checkBody('apartmentBuildingGroup', 'Chọn khu chung cư').notEmpty();
	req.checkBody('floor', 'Số tầng của tòa nhà ?').notEmpty();
	req.checkBody('manager', 'Chọn quản lý').notEmpty();
	
	req.getValidationResult().then(function (errors) {
		if (!errors.isEmpty()) {
			var errors = errors.mapped();

			ApartmentBuildingGroup.find({}, (err, abgs) => {
				User.find({}, (err, users) => {
					res.render('apartment-building/create', {
						title: 'Thêm tòa nhà',
						users: users,
						abgs: abgs,
						errors: errors,
						data: req.body
					});
				});
			});
		} else {
			const apartmentBuilding = new ApartmentBuilding();
			apartmentBuilding.buildingName = req.body.buildingName;
			apartmentBuilding.apartmentBuildingGroup = req.body.apartmentBuildingGroup;
			apartmentBuilding.floor = req.body.floor;
			apartmentBuilding.area = req.body.area;
			apartmentBuilding.manager = req.body.manager;
			apartmentBuilding.status = req.body.status;
			apartmentBuilding.createdBy = req.session.user._id;
			// apartmentBuilding.updatedBy = req.session.user._id;

			apartmentBuilding.save((err, ab) => {
				if (err) {
					console.log('error create new abg', err);
					return next(err);
				}
				/**
				 * Save to apartment building group
				 */
				ApartmentBuildingGroup.findById(ab.apartmentBuildingGroup, (err, abg) => {
					if (abg) {
						abg.apartmentBuildings.push(ab._id);
						abg.save();
					}
				})

				client.del('get_list_abs', () => {
					res.redirect('/apartment-building');
				})
			});
		}
	});
}

/**
 * 
 * @param {*} req : abgId
 * @param {*} res 
 * @param {*} next 
 */
exports.getView = (req, res, next) => {
	let clientKey = 'ab_view_' + req.params.abId;
	
	client.get(clientKey, (err, ab) => {
		if (err) {
			console.log('err', err);
			throw err;
		}
		if (ab && process.env.CACHE_ENABLE === 1) {
			ab = JSON.parse(abg);

			res.render('apartment-building/view', {
				title: ab.buildingName,
				current: ['apartment-building', 'view'],
				data: ab
			});
		} else {
			ApartmentBuilding.findById(req.params.abId)
				.populate('manager', {
					'_id': 0,
					'userName': 1
				})
				.populate('apartmentBuildingGroup', {
					'_id': 0,
					'abgName': 1
				})
				// .populate({
				// 	path: 'apartments',
				// 	model: 'Apartment',
				// 	populate: {
				// 		path: 'manager',
				// 		model: 'User',
				// 		select: { 'userName': 1 }
				// 	}
				// })
				.populate('createdBy', {
					'_id': 0,
					'userName': 1
				})
				.exec(function (err, ab) {
					if (err) {
						console.log('err', err)
						return next(err);
					}
			
					res.render('apartment-building/view', {
						title: ab.buildingName,
						current: ['apartment-building', 'view'],
						data: ab
					});

					/**
					 * Set redis cache data
					 */
					client.set(clientKey, JSON.stringify(ab));
				});
		}
	});
}