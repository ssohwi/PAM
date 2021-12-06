// DB Connect
const mongoose = require('mongoose');

var url = "mongodb://localhost:27017/pam";

const connect = () => {
    mongoose.connect(url, {
        useNewUrlParser: true
    },
    // mongoose.connect( process.env.MONGODB_URI,
        (error) => {
            if (error) {
                console.log('MongoDB connection failure!', error);
            } else {
                console.log('MongoDB connection success!');
            }
        });
};

mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error!', error);
});

mongoose.connection.on('disconnect', () => {
    console.error('The connection to MongoDB has been lost. Retry the connection!');
    connect();
});

module.exports = connect;