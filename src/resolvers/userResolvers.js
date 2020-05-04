const { getToken, encryptPassword, comparePassword } = require("../util");
const db = require('../db');
const { GraphQLScalarType } = require('graphql') ;

const {
    AuthenticationError,
} = require('apollo-server');

const userResolvers = {
    Query: {
        me: (parent, args, context, info) => {
            // console.log(context.user)
            if (context.loggedIn) {
                return context.user
            } else {
                throw new AuthenticationError("Please Login Again!")
            }
        },
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
        register: async (parent, args, context, info) => {
            const newUser = { username: args.username, password: await encryptPassword(args.password), createdAt: Date.now() };
            // Check conditions
            const user = await db.getCollection('user').findOne({ username: args.username });
            if (user) {
                throw new AuthenticationError("User Already Exists!")
            }
            try {
                const regUser = (await db.getCollection('user').insertOne(newUser)).ops[0];
                const token = getToken(regUser);
                return { ...regUser, token }
            } catch (e) {
                throw e
            }
        },
        login: async (parent, args, context, info) => {
            const user = await db.getCollection('user').findOne({ username: args.username });
            const isMatch = await comparePassword(args.password, user.password);
            if (isMatch) {
                const token = getToken(user);
                return { ...user, token };
            } else {
                throw new AuthenticationError("Wrong Password!")
            }
        },
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
        }
    })
};

module.exports = {
    userResolvers,
};
