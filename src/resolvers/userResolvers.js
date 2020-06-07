const {getToken, encryptPassword, comparePassword} = require('../util');
const {usersDao} = require('../dao/usersDao');
const ObjectId = require('mongodb').ObjectId;

const {GraphQLScalarType, Kind} = require('graphql');

const {
	AuthenticationError, UserInputError,
} = require('apollo-server');

const userResolvers = {
	Query: {
		me: async(parent, args, context) => {
			if (context.loggedIn) {
				return await usersDao.fetchUser({_id: ObjectId(context.user._id)});
			} else {
				throw new AuthenticationError('Please Login Again!');
			}
		},
		myRelationships: async(parent, args, context) => {
			if (!context.loggedIn) {
				throw new AuthenticationError('Please Login Again!');
			}
			const {page = 1, limit = 5, status = [0, 1, 2, 3]} = args;

			const {relationships} = await usersDao.fetchUser({_id: ObjectId(context.user._id)});

			const usersFilteredByStatus = relationships
				.filter(userRelationship =>
					status.includes(userRelationship.status));

			const userByIds = usersFilteredByStatus.map(elem =>
				elem.userId
			);

			const searchQuery = {_id: {$in: userByIds}};
			const count = await usersDao.countUsers(searchQuery);

			const usersResponse = await usersDao.fetchUsers(searchQuery, limit, page);

			// Ids of paginated usersResponse from response
			const usersResponseById = usersResponse.map(elem =>
				elem._id.toString()
			);

			const paginatedUsers = usersFilteredByStatus.filter(user => {
				return usersResponseById.includes(user.userId.toString());
			});

			const usersWithRelationships = paginatedUsers.map(paginatedUser => ({
				user: usersResponse.filter(x => x._id.equals(paginatedUser.userId))[0],
				status: paginatedUser.status,
				updatedAt: paginatedUser.updatedAt,
			}));

			return {
				users: usersWithRelationships,
				count,
				totalPages: Math.ceil(count / limit),
				currentPage: page,
			};
		},
		getUsersWithStatus: async(parent, args, context) => {
			if (!context.loggedIn) {
				throw new AuthenticationError('Please Login Again!');
			}
			const {searchTerm, page = 1, limit = 5} = args;
			let searchQuery = {};
			if (searchTerm) {
				searchQuery = {username: {$regex: searchTerm, $options: 'i'}, _id: {$ne: ObjectId(context.user._id)}};
			}

			const {relationships} = await usersDao.fetchUser({_id: ObjectId(context.user._id)});

			const userByIds = relationships.map(elem =>
				elem.userId.toString()
			);

			const count = await usersDao.countUsers(searchQuery);

			const users = await usersDao.fetchUsers(searchQuery, limit, page)
				.then(users => users.map(user => ({
					user,
					status:
								userByIds.includes(user._id.toString())
									? relationships.filter(x => x.userId.equals(user._id))[0].status
									: null,
				})
				));

			return {
				users,
				totalPages: Math.ceil(count / limit),
				currentPage: page,
			};
		},
		getUsers: async(parent, args, context) => {
			if (!context.loggedIn) {
				throw new AuthenticationError('Please Login Again!');
			}
			const {searchTerm, page = 1, limit = 5} = args;
			let searchQuery = {};
			if (searchTerm) {
				searchQuery = {username: {$regex: searchTerm, $options: 'i'}};
			}

			const count = await usersDao.countUsers(searchQuery);

			const users = await usersDao.fetchUsers(searchQuery, limit, page);

			console.log(users);
			return {
				users,
				totalPages: Math.ceil(count / limit),
				currentPage: page,
			};
		},
	},
	Mutation: {
		updateUserRelationship: async(parent, args, context) => {
			if (!context.loggedIn) {
				throw new AuthenticationError('Please Login Again!');
			}
			const senderUser = await usersDao.fetchUser({_id: ObjectId(context.user._id)});

			const receiverUser = await usersDao.fetchUser({_id: ObjectId(args._id)});

			const isReceiverPartOfSender = senderUser.relationships.filter(x =>
				x.userId.toString() === receiverUser._id.toString()
			);

			const isSenderPartOfReceiver = receiverUser.relationships.filter(x =>
				x.userId.toString() === senderUser._id.toString());


			if (isReceiverPartOfSender.length !== 1 || isSenderPartOfReceiver.length !== 1) {
				return 'no relationship';
			}

			await usersDao.updateUser({_id: receiverUser._id, 'relationships.userId': senderUser._id}, {
				$set: {
					'relationships.$.status': args.status,
				},
			}).catch(e => {
				console.log(e);
			});

			await usersDao.updateUser({_id: senderUser._id, 'relationships.userId': receiverUser._id}, {
				$set: {
					'relationships.$.status': args.status,
				},
			}).catch(e => {
				console.log(e);
			});


			return 'relationship';


		}
		,
		createUserRelationship: async(parent, args, context) => {
			if (!context.loggedIn) {
				throw new AuthenticationError('Please Login Again!');
			}
			const senderUser = context.user;

			const receiverUser = await usersDao.fetchUser({_id: ObjectId(args._id)});

			const isReceiverPartOfSender = senderUser.relationships.filter(x =>
				x.userId.toString() === receiverUser._id.toString()
			);

			const isSenderPartOfReceiver = receiverUser.relationships.filter(x =>
				x.userId.toString() === senderUser._id.toString());


			if (isReceiverPartOfSender.length !== 0 || isSenderPartOfReceiver.length !== 0) {
				return 'already requested';
			}

			const newReceiverUserRelationship = {
				userId: ObjectId(receiverUser._id),
				status: 0,
				updatedAt: Date.now(),
			};

			const newSenderUserRelationship = {
				userId: ObjectId(senderUser._id),
				status: 1,
				updatedAt: Date.now(),
			};

			await usersDao.updateUser({_id: receiverUser._id}, {
				$push: {
					relationships: {
						...newSenderUserRelationship,
					},
				},
			}).catch(e => {
				console.log(e);
			});

			await usersDao.updateUser({_id: ObjectId(senderUser._id)}, {
				$push: {
					relationships: {
						...newReceiverUserRelationship,
					},
				},
			}).catch(e => {
				console.log(e);
			}).then(res =>
				res);

			return 'good';

		},
		register:
				async(parent, args) => {
					const newUser = {
						username: args.username,
						password: await encryptPassword(args.password),
						createdAt: Date.now(),
						relationships: [],
					};
					const user = await usersDao.fetchUser({username: args.username});
					if (user) {
						throw new AuthenticationError('User Already Exists!');
					}
					const regUser = (await usersDao.insertUser(newUser)).ops[0];
					const token = getToken(regUser);
					return {...regUser, token};
				},
		login:
				async(parent, args) => {
					try {
						const user = await usersDao.fetchUser({username: args.username});
						const isMatch = await comparePassword(args.password, user.password);
						if (!isMatch) {
							return new UserInputError('Wrong Password!');
						} else {
							const token = getToken(user);
							return {...user, token};
						}
					} catch (e) {
						console.log(e);
						throw new AuthenticationError('User does not exist!');
					}
				},

	},
	Date: new GraphQLScalarType({
		name: 'Date',
		description: 'Custom date scalar',
		parseValue(value) {
			return value;
		},
		serialize(value) {
			return new Date(Number(value));
		},
		parseLiteral(ast) {
			if (ast.kind === Kind.INT) {
				return new Date(ast.value);
			}
			return null;
		},
	}),
}
;

module.exports = {
	userResolvers,
};
