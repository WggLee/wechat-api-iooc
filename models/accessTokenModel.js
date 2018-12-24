'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accessTokenSchema = new Schema({
  accessToken: {
    type: String,
    required: true,
    comment: 'access_token'
  },
  expiresIn: {
    type: String,
    required: true,
    comment: 'expires_in'
  }
}, {
  timestamps: {createdAt: 'created', updatedAt: 'updated'}
});

mongoose.model('AccessToken', accessTokenSchema);
