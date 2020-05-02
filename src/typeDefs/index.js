const { query } = require("./query");
const { userType, eventType } = require("./types");

const typeDefs = [query, userType, eventType] ;

module.exports = {
  typeDefs,
};
