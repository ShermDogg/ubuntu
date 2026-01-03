const express = require('express');
const mongoose = require('mongoose');
const {graphqlHTTP} = require('express-graphql');
const BodyParser = require('body-parser')
const cors = require('cors');
const dotenv =  require("dotenv");
const schema = require('./cprSchema.js');
const connectDB = require('./db.js');

const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Allow both localhost addresses
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

dotenv.config();

const app = express();
app.use(cors(corsOptions))
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

connectDB();

app.use('/graphql',
 graphqlHTTP ({
    schema,
    graphiql:true
    
    
})
);

app.listen(process.env.PORT, () => {
    console.log(`App running on PORT ${process.env.PORT}`);

});