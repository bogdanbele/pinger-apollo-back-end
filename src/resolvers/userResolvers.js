const {getToken, encryptPassword, comparePassword} = require('../util');
const db = require('../db');
const {GraphQLScalarType, Kind} = require('graphql') ;

const {
	AuthenticationError,  UserInputError,
} = require('apollo-server');

const userResolvers = {
	Query: {
		me: (parent, args, context) => {
			if (context.loggedIn) {
				return context.user;
			} else {
				throw new AuthenticationError('Please Login Again!');
			}
		},
	},
	Mutation: {
		register: async(parent, args) => {
			const newUser = {
				username: args.username,
				password: await encryptPassword(args.password),
				createdAt: Date.now()};
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
