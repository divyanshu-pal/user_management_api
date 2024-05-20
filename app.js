const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const routes = require('./routes');
const multer = require('multer');
const app = express();
require('dotenv').config();
app.use(bodyParser.json());
app.use('/api', routes);


const PORT = process.env.PORT||3000
mongoose.connect('mongodb://0.0.0.0:27017/user-management-api', { useNewUrlParser: true,
useUnifiedTopology: true,
    readPreference: 'primary'
})
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Unable to connect to the database:', error);
    });
