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
        date_sent: Date!
        date_end: Date!
  }
`;

const eventType = gql`
  type Event {
    title: String!
    eventCreator: User!
    description: String!
  }
`;

module.exports = {
  userType,
  eventType
};
