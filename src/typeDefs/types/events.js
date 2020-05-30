const {gql} = require('apollo-server');

const eventType = gql`
    type Event {
        _id: ID
        title: String!
        eventCreator: String!
        description: String!
        createdAt: Date!
        scheduledAt: Date
    }

    type Invite {
        _id: ID!
        users: [User!]!
        event: Event
        response: Int
        dateSent: Date!
        dateEnd: Date!
    }
`;
module.exports = {
	eventType,
};
