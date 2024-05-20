
const mongoose = require('mongoose');
const customPropertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  fallbackValue: { type: String, required: true },
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  unsubscribeToken: { type: String, unique: true },
  customProperties: { type: Map, of: String },
 
});

const listSchema = new mongoose.Schema({
  title: { type: String, required: true },
  customProperties: [customPropertySchema],
  users: [UserSchema],
});

const List = mongoose.model('List', listSchema);

module.exports = List;
