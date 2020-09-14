const db = require('../db');

// Get events
exports.fetchEvents = query =>
	db
		.events()
		.find(query)
		.toArray()
		.then(res => {
			return res;
		});

// Get event
exports.fetchEvent = query => db.events().findOne(query);

// Insert event
exports.createEvent = event => db.events().insertOne(event);

// Delete event
exports.deleteEvent = event => db.events().deleteOne(event);
