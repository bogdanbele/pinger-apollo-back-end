const {eventsDao} = require('../dao/eventsDao');
const {statuses} = require('../helpers/errorHandlers');

const ObjectId = require('mongodb').ObjectId;

const {AuthenticationError} = require('apollo-server');

const eventResolvers = {
	Query: {
		myEvents: async(parent, args, context) => {
			if (!context.loggedIn) {
				throw new AuthenticationError('Please Login Again!');
			}

			return await eventsDao.fetchEvents({eventCreator: context.user._id});
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
			return (await eventsDao.createEvent(newEvent)).ops[0];
		},
		deleteEvent: async(parent, args, context) => {
			if (!context.loggedIn) {
				throw new AuthenticationError('Please Login Again!');
			}

			const event = await eventsDao.fetchEvent({_id: ObjectId(args._id)});
			if (event) {
				await eventsDao.deleteEvent(event);
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
