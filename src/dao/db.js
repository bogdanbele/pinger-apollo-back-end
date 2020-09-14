const MongoClient = require('mongodb').MongoClient;

const state = {
	db: null,
};

exports.connect = (url, done) => {
	if (state.db) {
		return done();
	}
	MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
		if (err) {
			return done(err);
		}
		state.db = client.db('test');
		done();
	}).then();
};

exports.getCollection = collectionName => state.db.collection(collectionName);

exports.events = () => state.db.collection('events');

exports.users = () => state.db.collection('user');

exports.getDB = () => state.db;

exports.close = done => {
	if (state.db) {
		state.db.close(err => {
			state.db = null;
			state.mode = null;
			done(err);
		});
	}
};
