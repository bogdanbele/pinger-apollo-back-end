const {gql} = require('apollo-server');

const userType = gql`
    type User {
        _id: ID!
        username: String!
        password: String!
        token: String
        createdAt: Date!
    }
`;

const inviteType = gql`
    type Invite {
        _id: ID!
        users: [User!]!
        event: Event
        response: Int
        dateSent: Date!
        dateEnd: Date!
    }
`;

const eventType = gql`
    type Event {
        _id: ID
        title: String!
        eventCreator: String!
        description: String!
        createdAt: Date!
    }
`;

module.exports = {
	userType,
	eventType,
};
