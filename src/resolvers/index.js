const { userResolvers } = require('./userResolvers');
const { eventResolvers } = require('./eventResolvers');
const resolvers = [userResolvers,eventResolvers]

module.exports = {
  resolvers,
};