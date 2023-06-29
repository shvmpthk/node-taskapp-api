const mongoose = require('mongoose')

mongoose.connect( process.env.MONGODB_URL, {
    autoIndex: true
})

module.exports = mongoose