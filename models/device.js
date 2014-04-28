var mongoose = require("mongoose");

var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

var DeviceSchema = new Schema({
                                deviceToken: {type: String, unique: true},
                                updatedAt: {type: Date, default: function(){return new Date();}},
                                channels: {type: Array, index: true},
                                valid: {type: Boolean, index: true},
                                production: {type: Boolean, default: function(){return true;}}

                        });

var Device = mongoose.model('Device', DeviceSchema);

module.exports.Device = Device;