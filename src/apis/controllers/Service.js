const User = require('./../../models/User');
const Service = require('./../../models/Service');
const ServiceRequest = require('./../../models/ServiceRequest');
const ServiceCategory = require('./../../models/ServiceCategory');
const Notification = require('./../../models/Notification');

exports.getCategories = (req, res, next) => {
	ServiceCategory.find({
		status: 1
	}).sort({
		orderDisplay: 1
	}).exec((err, data) => {
		if (err) {
			return res.json({
				success: false,
				errorCode: '112',
				message: 'Có lỗi xảy ra'
			})
		}

		return res.json({
			success: true,
			errorCode: 0,
			data: data,
			message: 'Get data successfully'
		})
	})
}

// Get all services
exports.getIndex = function (req, res) {
	try {
		Service.find({
			status: 1,
			category: req.params.categoryId
		})
		.populate({
			path: 'category',
			model: 'ServiceCategory'
		})
		.sort({
			orderDisplay: 1
		})
		.exec(function (err, services) {
			if (err) {
				return res.json({
					success: false,
					errorCode: '112',
					message: "Error happen"
				})
			}
			return res.json({
				success: true,
				errorCode: 0,
				data: services,
				message: 'Get list services successfully'
			});
		});
	} catch (e) {
		return res.json({
			success: false,
			errorCode: '111',
			data: [],
			message: 'Exception'
		})
	}
};

exports.postCreateRequest = (req, res, next) => {
	try {
		req.checkBody('fullName', 'Vui lòng nhập họ tên đầy đủ').notEmpty();
		req.checkBody('phoneNumber', 'Vui lòng nhập số điện thoại').notEmpty();
		req.checkBody('serviceId', 'Mã dịch vụ không được để trống').notEmpty();

		var errors = req.getValidationResult().then(function (errors) {
			if (!errors.isEmpty()) {
				return res.json({
					success: false,
					errorCode: '011',
					message: errors.mapped(),
				});
			} else {
				Service.findById(req.body.serviceId, (err, service) => {
					if (!service) {
						return res.json({
							success: false,
							errorCode: '0111',
							message: 'Dịch vụ không tồn tại'
						});
					}
					let data = req.body;
					let newServiceRequest = new ServiceRequest();

					newServiceRequest.fullName = data.fullName;
					newServiceRequest.phoneNumber = data.phoneNumber;
					newServiceRequest.address = data.address;
					newServiceRequest.images = data.images;
					newServiceRequest.description = data.description;
					newServiceRequest.orderAt = data.orderAt;
					newServiceRequest.status = 1;
					newServiceRequest.done = false;
					newServiceRequest.invoice_imgs = "";
					newServiceRequest.service = service._id;
					newServiceRequest.createdBy = req.session.user._id;
					newServiceRequest.save(function (err, newServiceRequest) {
						if (err) {
							return res.json({
								success: false,
								errorCode: '010',
								message: errors,
								data: req.body
							})
						} else {
							/**
							 * Push notification to admin and building manager
							 */
							User.findById(req.session.user._id)
							.populate({
								path: 'building',
								model: 'ApartmentBuilding',
								populate: {
									path: 'apartmentBuildingGroup',
									model: 'ApartmentBuildingGroup'
								}
							}).exec((err, user) => {
								if (user && user.building) {
									let newNoti = new Notification();
									newNoti.title = 'Yêu cầu dịch vụ mới từ ' + newServiceRequest.fullName,
									newNoti.recipient = user.building.manager;
									newNoti.building = user.building._id,
									newNoti.buildingGroup = user.building.apartmentBuildingGroup._id;
									newNoti.createdBy = user._id;
									newNoti.type = 2;
									newNoti.objId = newServiceRequest._id;
									newNoti.save();
								}
								User.find({
									role: 'ADMIN',
									_id: {
										$ne: (user && user.building) ? user.building.manager : null
									}
								}).exec((err, admins) => {
									
									for (let i=0; i<admins.length; i++) {
										let newNoti = new Notification();
										newNoti.title = 'Yêu cầu dịch vụ mới từ ' + newServiceRequest.fullName,
										newNoti.recipient = admins[i]._id;
										newNoti.building = (user.building) ? user.building._id : null,
										newNoti.buildingGroup = user.building ? user.building.apartmentBuildingGroup._id : null;
										newNoti.createdBy = user._id;
										newNoti.type = 2;
										newNoti.objId = newServiceRequest._id;
										newNoti.save();
									}
								})
							});

							res.json({
								success: true,
								errorCode: 0,
								data: newServiceRequest,
								message: 'Gửi yêu cầu thành công'
							});
						}
					})
				})
			}
		});
	} catch (e) {
		return res.json({
			success: false,
			errorCode: '111',
			message: 'Server error'
		})
	}
}

exports.getDeleteRequest = (req, res, next) => {
	let user = req.session.user, srId = req.params.srId;

	if (!user || !srId) {
		return res.json({
			success: false,
			errorCode: '112',
			message: 'Xóa yêu cầu dịch vụ không thành công'
		})
	} else {
		ServiceRequest.remove({
			_id: srId,
			createdBy: user._id
		}, (err, result) => {
			if (err) {
				return res.json({
					success: false,
					errorCode: '112',
					message: 'Có lỗi xảy ra'
				})
			} else {
				return res.json({
					success: true,
					errorCode: 0,
					message: 'Xóa yêu cầu dịch vụ thành công'
				})
			}
		})
	}
}

exports.updateInvoiceService = (req, res, next) => {
	try {
		req.checkBody('id', 'id không được để trống').notEmpty();
		req.checkBody('invoice_imgs', 'Ảnh hóa đơn không được để  trống').notEmpty();
		let id = req.body.id,
		invoice_imgs = req.body.invoice_imgs;

		ServiceRequest.findById(id).exec(function (err, srs) {
			if (err) {
				return res.json({
					success: false,
					errorCode: '011',
					message: err,
				});
			}
		console.log("srs",srs);
		if(srs){
			srs.done = true;
			srs.invoice_imgs = req.body.invoice_imgs;
			srs.save(function (err, updateServiceRequest) {
				if (err) {
					return res.json({
						success: false,
						errorCode: '010',
						message: errors,
						data: req.body
					})
				} else {
					return res.json({
						success: true,
						errorCode: 0,
						message: 'Cập nhật thanh toán thành công'
					});
				}
			})
		}else{
			return res.json({
				success: false,
				errorCode: '002',
				message: 'Không tìm thấy id services request'
			})
		}

		});
	} catch (e) {
		return res.json({
			success: false,
			errorCode: '111',
			message: 'Server exception'
		})
	}

}
exports.getHistoryTransaction = (req, res, next) => {
	ServiceRequest.find({ createdBy: req.session.user._id })
		.populate({
			path: 'service',
			model: 'Service',
			select: { 
				'_id': 0, 'serviceName': 1, 'image': 1,
				'imageUrl': 1, 'icon': 1, 'iconUrl': 1,
				'invoice_imgs': 1, 'invoice_imgs_vitrual': 1
			}
		})
		.sort('-createdAt')
		.exec(function (err, srs) {
			if (err) {
				return res.json({
					success: false,
					errorCode: '112',
					message: 'Get list history transaction failed'
				});
			}
			res.json({
				success: true,
				errorCode: 0,
				data: srs,
				message: 'Get list history transaction successfully'
			});
		});
}

exports.postUpdateCategoryOrder = (req, res, next) => {
	let orderIds = JSON.parse(req.body.orderIds);

	if (orderIds && orderIds instanceof Array) {
		for (let i=0; i<orderIds.length; i++) {
			ServiceCategory.findById(orderIds[i], (err, sc) => {
				if (sc) {
					sc.orderDisplay = (i + 1);
					sc.save();
				}
			})
		}
		res.json({
			success: true,
			errorCode: 0
		})
	} else {
		return res.json({
			success: false
		})
	}
}

exports.postUpdateServiceOrder = (req, res, next) => {
	let orderIds = JSON.parse(req.body.orderIds);

	if (orderIds && orderIds instanceof Array) {
		for (let i=0; i<orderIds.length; i++) {
			Service.findById(orderIds[i], (err, s) => {
				if (s) {
					s.orderDisplay = (i + 1);
					s.save();
				}
			})
		}
		res.json({
			success: true,
			errorCode: 0
		})
	} else {
		return res.json({
			success: false
		})
	}
}