const {gql} = require('apollo-server');

const userType = gql`
	type User {
		_id: ID!
		username: String!
		password: String!
		token: String
		relationships: [UserRelationship]
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

const userResultType = gql`
	type UsersResult {
		users: [User]
		currentPage: Int
		totalPages: Int
	}
	
	type UserStatusResult {
		users : [UserStatus]
        currentPage: Int
        totalPages: Int
	}
`;

// status
// 0 - pending      -- sent by user 1
// 1 - awaitingResponse     -- received by user 2
// 2 - accepted
// 3 - declined
// 4 - blocked

/*
	User 1 sends a friend request to User 2
	UserRelationShip Created for User 1 with status: 0
	UserRelationShip Created for User 2 with status: 1

	User 2 responds with status 2
	UserRelationShip Updated for both users with status: 2

	User 2 responds with status 3
	UserRelationShip Updated for both users with status: 3

 */

const userRelationship = gql`
	type UserRelationship {
		userId: ID!
		status: Int!
        updatedAt: Date!
    }
	
	type ExtendedUserRelationship {
		user: User!
		status: Int!
        updatedAt: Date!
	}
	
	type UserStatus {
		user: User!
		status: Int
	}
`;


const eventType = gql`
	type Event {
		_id: ID
		title: String!
		eventCreator: String!
		description: String!
		createdAt: Date!
		scheduledAt: Date
	}
`;

module.exports = {
	userType,
	eventType,
	inviteType,
	userResultType,
	userRelationship,
};
