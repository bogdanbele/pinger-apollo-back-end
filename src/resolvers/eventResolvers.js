const {statuses} = require('../helpers/errorHandlers');

const db = require('../db');
const ObjectId = require('mongodb').ObjectId;

const {AuthenticationError} = require('apollo-server');

const eventResolvers = {
	Query: {
		myEvents: async(parent, args, context) => {
			if (!context.loggedIn) {
				throw new AuthenticationError('Please Login Again!');
			}
			return (await db.getCollection('events').find({eventCreator: context.user._id}))
				.toArray()
				.then(res => {
					return res;
				});
		},
	},
	Mutation: {
		createEvent: async(parent, args, context) => {
			if (!context.loggedIn) {
				throw new AuthenticationError('Please Login Again!');
			}

			const {title, description, scheduledAt} = args;

			const newEvent = {
				eventCreator: context.user._id,
				title,
				description,
				createdAt: Date.now(),
				scheduledAt,
			};
			return (await db.getCollection('events').insertOne(newEvent)).ops[0];
		},
		deleteEvent: async(parent, args, context) => {
			if (!context.loggedIn) {
				throw new AuthenticationError('Please Login Again!');
			}

			const event = await db.getCollection('events').findOne({_id: ObjectId(args._id)});
			if (event) {
				await db.getCollection('events').deleteOne(event);
				return statuses.SUCCESS;
			} else {
				return statuses.NO_MATCH;
			}
		},
	},
};

module.exports = {
	eventResolvers,
};
