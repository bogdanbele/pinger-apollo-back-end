const {query} = require('./query');
const {userType, eventType, userResultType, userRelationship} = require('./types');

const typeDefs = [query, userType, eventType, userResultType, userRelationship] ;

module.exports = {
	typeDefs,
};