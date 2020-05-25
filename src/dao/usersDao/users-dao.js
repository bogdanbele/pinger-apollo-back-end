const db = require('../db');

// Get user
exports.getUser = query => db.users().findOne(query);
