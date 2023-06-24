const mongoose = require('mongoose')

mongoose.connect( process.env.MONGODB_URL, {
    autoIndex: true
})

// user.save().then((task)=>{
//     console.log(task)
// }).catch((error)=>{
//     console.log(error)
// })

// task.save().then((task)=>{
//     console.log(task)
// }).catch((error)=>{
//     console.log(error)
// })