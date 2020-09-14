const {userResolvers} = require('./user/userResolvers');
const {eventResolvers} = require('./event/eventResolvers');
const resolvers = [userResolvers,eventResolvers];

module.exports = {
	resolvers,
};