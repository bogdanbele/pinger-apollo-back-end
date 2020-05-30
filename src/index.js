const {ApolloServer} = require('apollo-server');
const {typeDefs} = require('./typeDefs/schema.js');
const {resolvers} = require('./resolvers');
const {getPayload} = require('./util');
const db = require('./dao/db');
require('dotenv').config();

const server = new ApolloServer({
	typeDefs,
	resolvers,
	engine: {
		apiKey: process.env.APOLLO_KEY,
	},
	context: ({req}) => {

		// Connect to DB
		db.connect(process.env.MONGO_DB_URI, err => {
			if (err) {
				console.error(err);
			} else {
				console.log('Successfully Connected to MongoDB!');
			}
		});

		// get the user token from the headers
		const token = req.headers.authorization || '';
		// try to retrieve a user with the token
		const {payload: user, loggedIn} = getPayload(token);

		// add the user to the context
		return {user, loggedIn};
	},
});

server.listen().then(({url}) => {
	console.log(`🚀  Server ready at ${url}`);
});
