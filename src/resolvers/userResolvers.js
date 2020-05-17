const {getToken, encryptPassword, comparePassword} = require('../util');
const db = require('../db');
const ObjectId = require('mongodb').ObjectId;

const {GraphQLScalarType, Kind} = require('graphql');

const {
	AuthenticationError, UserInputError,
} = require('apollo-server');

const userResolvers = {
	Query: {
		me: (parent, args, context) => {
			if (context.loggedIn) {
				console.log(context.user);
				return context.user;
			} else {
				throw new AuthenticationError('Please Login Again!');
			}
		},
		getUsers: async(parent, args) => {
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
		createUserRelationship: async(parent, args, context) => {
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
		register: async(parent, args) => {
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
		login: async(parent, args) => {
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
