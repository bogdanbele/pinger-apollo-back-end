const { gql } = require("apollo-server");

const userType = gql`
  type User {
    username: String!
    password: String!
    token: String
    createdAt: Date!
  }
`;

const inviteType = gql`
  type Invite {
        users: [User!]!
        event: Event
        response: Int
        dateSent: Date!
        dateEnd: Date!
  }
`;

const eventType = gql`
  type Event {
    title: String!
    eventCreator: String!
    description: String!
    createdAt: Date!
  }
`;

module.exports = {
  userType,
  eventType
};
