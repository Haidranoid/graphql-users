const graphql = require('graphql');
const _ = require('lodash');
const axios = require("axios");
const {
    GraphQLObjectType,
    GraphQLID,
    GraphQLString,
    GraphQLInt,
    GraphQLSchema,
    GraphQLList,
    GraphQLNonNull
} = graphql;

const CompanyType = new GraphQLObjectType({
    name: 'Company',
    fields: () => ({
        id: {type: GraphQLID},
        name: {type: GraphQLString},
        description: {type: GraphQLString},
        users: {
            type:  new GraphQLList(UserType),
            async resolve(company){
                const {data} = await axios.get(`http://localhost:3000/users`);
                const usersFiltered = _.filter(data, {companyId: company.id})
                return usersFiltered;
            }
        }
    })
})

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: {type: GraphQLID},
        firstName: {type: GraphQLString},
        age: {type: GraphQLInt},
        company: {
            type: CompanyType,
            async resolve(user){
                const {data} = await axios.get(`http://localhost:3000/companies/${user.companyId}`)
                return data;
            }
        }
    })
})

const RootQuery = new GraphQLObjectType({
    name: 'Query',
    fields: {
        user: {
            type: UserType,
            args: {id: {type: GraphQLID}},
            async resolve(parentValue, args) {
                const {data} = await axios.get(`http://localhost:3000/users/${args.id}`)
                return data;
            }
        },
        users: {
            type: new GraphQLList(UserType),
            async resolve(parentValue, args) {
                const {data} = await axios.get(`http://localhost:3000/users`)
                return data;
            }
        },
        company: {
            type: CompanyType,
            args: {id: {type: GraphQLID}},
            async resolve(parentValue, args) {
                const {data} = await axios.get(`http://localhost:3000/companies/${args.id}`)
                return data;
            }
        },
        companies: {
            type: new GraphQLList(CompanyType),
            async resolve(parentValue, args) {
                const {data} = await axios.get(`http://localhost:3000/companies`)
                return data;
            }
        }
    }
})

const RootMutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addUser: {
            type: UserType,
            args: {
                firstName: { type: new GraphQLNonNull(GraphQLString) },
                age: { type: new GraphQLNonNull(GraphQLInt) },
                companyId: { type: GraphQLString },
            },
            async resolve(root,args){
                const {firstName, age, companyId} = args;
                const {data} = await axios.post(`http://localhost:3000/users`, {firstName, age})
                return data;
            }
        },
        deleteUser: {
            type: UserType,
            args: {
                userId: { type: new GraphQLNonNull(GraphQLID)},
            },
            async resolve(root,args){
                const {userId} = args;
                const {data} = await axios.get(`http://localhost:3000/users/${userId}`)
                await axios.delete(`http://localhost:3000/users/${userId}`);
                return data;
            }
        },
        updateUser: {
            type: UserType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID)},
                firstName: { type: GraphQLString },
                age: { type: GraphQLInt },
                companyId: { type: GraphQLString },
            },
            async resolve(root,args){
                const {data} = await axios.patch(`http://localhost:3000/users/${args.id}`, args);
                return data;
            }
        },
    }
})

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: RootMutation,
})