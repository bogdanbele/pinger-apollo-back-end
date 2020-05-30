const {gql} = require('apollo-server');

const query = gql`
    scalar Date
    scalar Time
    scalar DateTime

    type Query {
        me: User
        myEvents: [Event]
        myRelationships(status: [Int]): [ExtendedUserRelationship]
        getUsers(searchTerm: String, page: Int, limit: Int): UsersResult
        getUsersWithStatus(searchTerm: String, page: Int, limit: Int): UserStatusResult
    }
    type Mutation {
        register(username: String!, password: String!): User
        login(username: String!, password: String!): User
        createEvent(title: String!, description: String!, scheduledAt: Date): Event
        deleteEvent(_id: ID!): String!
        createUserRelationship(_id: ID!): String!
    }
`;

module.exports = {
	query,
};
