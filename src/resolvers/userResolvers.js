const {getToken, encryptPassword, comparePassword} = require('../util');
const {usersDao} = require('../dao/usersDao');

const db = require('../dao/db');
const ObjectId = require('mongodb').ObjectId;

const {GraphQLScalarType, Kind} = require('graphql');

const {
	AuthenticationError, UserInputError,
} = require('apollo-server');

const userResolvers = {
	Query: {
		me: async (parent, args, context) => {
			if (context.loggedIn) {
				return await usersDao.fetchUser({_id: ObjectId(context.user._id)});
			} else {
				throw new AuthenticationError('Please Login Again!');
			}
		},
		myRelationships: async (parent, args, context) => {
			if (!context.loggedIn) {
				throw new AuthenticationError('Please Login Again!');
			}
			const {page = 1, limit = 5, status = [0, 1, 2, 3]} = args;

			const {relationships} = await usersDao.fetchUser({_id: ObjectId(context.user._id)});

			const filteredUsers = relationships
				.filter(userRelationship =>
					status.includes(userRelationship.status));

			const userByIds = filteredUsers.map(elem =>
				elem.userId
			);

			const searchQuery = {_id: {$in: userByIds}};

			const count = await db.getCollection('user')
				.countDocuments(searchQuery);

			// userDao.getUsers(searchQuery,limit,page)
			const {users, totalPages, currentPage} = await usersDao.fetchUsers(searchQuery, limit, page)
				.then(users => {
					return {
						users,
						totalPages: Math.ceil(count / limit),
						currentPage: page,
					};
				});

			const usersWithRelationships = filteredUsers.map(elem => ({
				user: users.filter(x => x._id.equals(elem.userId))[0],
				status: elem.status,
				updatedAt: elem.updatedAt,
			}));

			return {
				users: usersWithRelationships,
				count,
				totalPages,
				currentPage,
			};
		},
		getUsersWithStatus: async (parent, args, context) => {
			if (!context.loggedIn) {
				throw new AuthenticationError('Please Login Again!');
			}
			const {searchTerm, page = 1, limit = 5} = args;
			let searchQuery = {};
			if (searchTerm) {
				searchQuery = {username: {$regex: searchTerm, $options: 'i'}, _id: {$ne: ObjectId(context.user._id)}};
			}

			const {relationships} = await db.getCollection('user').findOne({_id: ObjectId(context.user._id)});

			const userByIds = relationships.map(elem =>
				elem.userId.toString()
			);

			console.log(userByIds);


			const count = await db.getCollection('user')
				.countDocuments(searchQuery);

			const users = await db.getCollection('user')
				.find(searchQuery)
				.limit(limit)
				.skip((page - 1) * limit).toArray()
				.then(users => {
					const usersWithStatus = users.map(user => {
						return {
							user,
							status:
								userByIds.includes(user._id.toString())
									? relationships.filter(x => x.userId.equals(user._id))[0].status
									: null,
						};
					});


					return {
						users: usersWithStatus,
						totalPages: Math.ceil(count / limit),
						currentPage: page,
					};
				});

			console.log(users);

			return users;

		},
		getUsers: async (parent, args, context) => {
			if (!context.loggedIn) {
				throw new AuthenticationError('Please Login Again!');
			}
			const {searchTerm, page = 1, limit = 5} = args;
			let searchQuery = {};
			if (searchTerm) {
				searchQuery = {username: {$regex: searchTerm, $options: 'i'}};
			}

			const count = await db.getCollection('user').countDocuments(searchQuery);

			const users = await db.getCollection('user').find(searchQuery).limit(limit)
				.skip((page - 1) * limit).toArray()
				.then(users => {
					console.log(users);
					return {
						users,
						totalPages: Math.ceil(count / limit),
						currentPage: page,
					};
				});
			console.log(users);
			return users;
		},
	},
	Mutation: {
		createUserRelationship: async (parent, args, context) => {
			if (!context.loggedIn) {
				throw new AuthenticationError('Please Login Again!');
			}
			const senderUser = context.user;

			const receiverUser = await db.getCollection('user').findOne({_id: ObjectId(args._id)});

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

			await db.getCollection('user').updateOne({_id: receiverUser._id}, {
				$push: {
					relationships: {
						...newSenderUserRelationship,
					},
				},
			}).catch(e => {
				console.log(e);
			}).then(res =>
				res);

			await db.getCollection('user').updateOne({_id: ObjectId(senderUser._id)}, {
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
		register: async (parent, args) => {
			const newUser = {
				username: args.username,
				password: await encryptPassword(args.password),
				createdAt: Date.now(),
				relationships: [],
			};
			const user = await db.getCollection('user').findOne({username: args.username});
			if (user) {
				throw new AuthenticationError('User Already Exists!');
			}
			const regUser = (await db.getCollection('user').insertOne(newUser)).ops[0];
			const token = getToken(regUser);
			return {...regUser, token};
		},
		login: async (parent, args) => {
			try {
				const user = await db.getCollection('user').findOne({username: args.username});
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
};

module.exports = {
	userResolvers,
};
