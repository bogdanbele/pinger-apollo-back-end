const db = require('../db');

const {
    AuthenticationError,
} = require('apollo-server');

const eventResolvers = {
    Query: {
        myEvents: async (parent, args, context, info) => {
            if (!context.loggedIn) {
                throw new AuthenticationError("Please Login Again!")
            }
            try{
                const eventList = (await db.getCollection('events').find({ eventCreator: context.user.username})).toArray().then(res => { return res });
                console.log(eventList)
                return eventList
            }catch (e) {
                throw e
            }

        }
    },
    Mutation: {
        createEvent: async(parent, args, context, info) => {
            if (!context.loggedIn) {
                throw new AuthenticationError("Please Login Again!")
            }
            const { title, description } = args;
            const newEvent = { eventCreator: context.user.username, title, description, createdAt: Date.now()};
            try {
                return (await db.getCollection('events').insertOne(newEvent)).ops[0]
            }catch (e) {
                throw e
            }
        },
    }
}

module.exports = {
    eventResolvers
}