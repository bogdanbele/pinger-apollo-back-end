const db = require('../db');

// Get user
exports.getUser = query => db.users().findOne(query);

// Count Users
exports.countUsers = query => db.users().countDocuments(query);