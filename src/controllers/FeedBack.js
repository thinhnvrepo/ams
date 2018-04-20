const FeedBack = require('../models/FeedBack');

// Get all Categories
exports.getIndex = function (req, res) {
	FeedBack.find({}).populate('user').sort('-createdAt').exec(function (err, fbs) {
		if (err) {
			console.log('err', err)
			return res.json({
				success: false,
				errorCode: '121',
				message: 'Lỗi không xác định'
			})
		}
		res.render('feedback/index', {
			title: 'Bao cao sai pham',
			current: ['feedback', 'index'],
			data: fbs
		});
	});
};