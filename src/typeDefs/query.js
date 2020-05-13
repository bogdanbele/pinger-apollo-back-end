const {gql} = require('apollo-server');

const query = gql`
	scalar Date
	scalar Time
	scalar DateTime

	type Query {
		me: User
		myEvents: [Event]
		users(searchTerm: String!): [User]
	}
	type Mutation {
		register(username: String!, password: String!): User
		login(username: String!, password: String!): User
		createEvent(title: String!, description: String!, scheduledAt: Date): Event
		deleteEvent(_id: ID!): String!
	}
`;

module.exports = {
	query,
};
