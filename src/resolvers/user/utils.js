const ObjectId = require('mongodb').ObjectId;

const checkIsLoggedIn = context => !context.loggedIn;

const createNewUserRelationshipObject = (userId, status) => ({
	userId: ObjectId(userId),
	status,
	updatedAt: Date.now(),
});

// const createUserRelationship = ()

module.exports = {
	checkIsLoggedIn,
	createNewUserRelationshipObject,
};
