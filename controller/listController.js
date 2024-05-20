const List = require('../model/ListModel');

const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); 
    },
    filename: function (req, file, cb) {
       
        cb(null, Date.now() + '-' + file.originalname);
    }
});


const upload = multer({ storage: storage });
const createList = async (req, res) => {
    const { title, customProperties } = req.body;

    try {
        const list = new List({ title, customProperties });
        await list.save();
        res.status(201).json(list);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


const uploadUsers = async (req, res) => {
    const listId = req.params.listId;

    try {
        const list = await List.findById(listId);
        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }

        const customPropsMap = list.customProperties.reduce((acc, prop) => {
            acc[prop.title] = prop.fallbackValue;
            return acc;
        }, {});

        const errors = [];
        let successCount = 0;

        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

      
        const fileStream = fs.createReadStream(file.path);

        const users = [];
        fileStream.pipe(csv())
            .on('data', (row) => {
                const { name, email } = row;
                if (!name || !email) {
                    errors.push({ line: csv.lines, error: 'Missing name or email' });
                    return;
                }

                const unsubscribeToken = generateUnsubscribeToken();
                

                const userData = { name, email,unsubscribeToken,customProperties: {}};
                for (const propTitle in customPropsMap) {
                    userData.customProperties[propTitle] = row[propTitle] || customPropsMap[propTitle];
                }

                users.push(userData);
            })
            .on('end', async () => {
                const session = await mongoose.startSession();
                (session);
                
                try {
                    for (const user of users) {
                     
                        const existingUser = list.users.find(u => u.email === user.email);
                        if (existingUser) {
                            errors.push({ email: user.email, error: 'Duplicate email' });
                            continue;
                        }

                       
                        
                        list.users.push(user);
                        successCount++;
                    }
                    await list.save({ session });
                  
                    session.endSession();
                    res.status(201).json({
                        successCount,
                        errorCount: errors.length,
                      
                        totalCount:list.users.length,
                        errors
                    });
                } catch (error) {
                   
                    session.endSession();
                    res.status(500).json({ error: error.message });
                }
            })
            .on('error', (error) => {
               
                return res.status(500).json({ error: error.message });
            });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }


};


const unsubscribeUser = async (req, res) => {
    const { token } = req.query;
        try {
            const result = await List.findOne({ 'users.unsubscribeToken':token}, { 'users.$': 1 });
            if(!result){
                return res.status(404).json({ error: 'User not found or already unsubscribed' });
            }
           
                await List.updateOne(
                    { 'users.unsubscribeToken': token },
                    { $pull: { users: { unsubscribeToken: token } } }
                );

            res.status(200).json({ message: 'Unsubscribed successfully' });
            
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
        
};


const generateUnsubscribeToken = () => {
    return uuidv4();
};

module.exports = { createList, uploadUsers, upload,unsubscribeUser};
