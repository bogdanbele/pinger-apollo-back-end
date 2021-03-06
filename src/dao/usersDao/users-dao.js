const db = require('../db');

// Get User
exports.fetchUser = query => db.users().findOne(query);

// Count Users
exports.countUsers = query => db.users().countDocuments(query);

// Get Users
exports.fetchUsers = (query, limit, page) =>
	db
		.users()
		.find(query)
		.limit(limit)
		.skip((page - 1) * limit)
		.toArray();

// Update User
exports.updateUser = (filter, update) => db.users().updateOne(filter, update);

// Insert User
exports.insertUser = user => db.users().insertOne(user);
