const {query} = require('./query');
const {userType, eventType, userResultType} = require('./types');

const typeDefs = [query, userType, eventType, userResultType] ;

module.exports = {
	typeDefs,
};
