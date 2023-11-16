const mongoose = require('mongoose');

require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL;

mongoose.connection.on('open', () => {
    console.log('Connected to mongo DB!');
})

mongoose.connection.on('error', (err) => {
    console.error(err);
})

async function mongoConnect (){ 
    await mongoose.connect(MONGO_URL);
}

async function mongoDisconnect(){
    await mongoose.disconnect();
}
module.exports = {
    mongoConnect,
    mongoDisconnect
}

