const {query} = require('./types/query');
const {userType, eventType} = require('./types');

const typeDefs = [query, userType, eventType];

module.exports = {
	typeDefs,
};
