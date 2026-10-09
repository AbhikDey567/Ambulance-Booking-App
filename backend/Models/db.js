const mongoose = require('mongoose');

const mongo_url = "mongodb://0.0.0.0:27017/ambulance";

mongoose.connect(mongo_url)
    .then(() => {
        console.log('MongoDB Connected...');
    }).catch((err) => {
        console.log('MongoDB Connection Error: ', err);
    });