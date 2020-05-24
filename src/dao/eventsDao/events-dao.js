const db = require('../db');

// Get events
exports.getEvents = query => db.events().find(query).toArray()
	.then(res => {
		return res;
	});

// Get event
exports.getEvent = query => db.events().findOne(query);

// Insert event
exports.insertEvent = event => db.events().insertOne(event);

// Delete event
exports.deleteEvent = event => db.events().deleteOne(event);
