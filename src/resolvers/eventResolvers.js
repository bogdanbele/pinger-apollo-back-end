const {statuses} = require('../helpers/errorHandlers');

const db = require('../db');
const ObjectId = require('mongodb').ObjectId;

const {
	AuthenticationError,
	UserInputError,
} = require('apollo-server');

const eventResolvers = {
	Query: {
		myEvents: async(parent, args, context, info) => {
			if (!context.loggedIn) {
				throw new AuthenticationError('Please Login Again!');
			}
			try {
				return (await db.getCollection('events')
					.find({eventCreator: context.user.username}))
					.toArray()
					.then(res => {
						return res;
					});
			} catch (e) {
				throw e;
			}

		},
	},
	Mutation: {
		createEvent: async(parent, args, context, info) => {
			if (!context.loggedIn) {
				throw new AuthenticationError('Please Login Again!');
			}

			const {title, description} = args;

			const newEvent = {
				eventCreator: context.user.username,
				title,
				description,
				createdAt: Date.now(),
			};
			try {
				return (await db.getCollection('events').insertOne(newEvent)).ops[0];
			} catch (e) {
				throw e;
			}
		},
		deleteEvent: async(parent, args, context, info) => {
			if (!context.loggedIn) {
				throw new AuthenticationError('Please Login Again!');
			}
			try {
				const event = await db.getCollection('events').findOne({_id: ObjectId(args._id)});
				if (event) {
					await db.getCollection('events').deleteOne(event);
					return statuses.SUCCESS;
				} else {
					return statuses.NO_MATCH;
				}
			} catch (e) {
				throw e;
			}
		},
	},
};

module.exports = {
	eventResolvers,
};