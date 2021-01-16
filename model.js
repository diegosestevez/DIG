const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
	title: String,
	desc: String,
	images: Array
});

module.exports.categoryModel = new mongoose.model('Category', categorySchema);
