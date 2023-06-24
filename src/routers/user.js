const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')

const router = express.Router()
const upload = multer({ 
    // dest: 'avatars',
    limits: {
        fileSize: 2000000
    },
    fileFilter(req, file, callback){
        if(file.originalname.match(/\.(jpg|jpeg|png)$/))
            return callback(undefined, true)
        return callback('Please upload an image. Only JPG/JPEG/PNG files supported')
    }
})

router.post('/users', async (req, res)=> {
    const user = new User(req.body)

    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})    
    } catch (error) {
        res.status(400).send(error)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCreadentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token})
    } catch (error) {
        res.status(400).send({error})
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.status(200).send(req.user)
})

router.patch('/users/me', auth, async (req, res)=> {
    
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send('{ "Error": "Invalid Keys provided !" }')
    }

    try {    
        const user = req.user
        updates.forEach(update => user[update] = req.body[update])
        await user.save()
        res.send(user)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.get('/users/me/avatar', auth, async (req, res) => {
    try {
        if(!req.user.avatar)
            throw new Error('Image does not exist !')
        res.set('content-type','image/png').send(req.user.avatar)
    } catch (error) {
        res.status(404).send({ error: error.message })
    }
})

router.get('/users/:id/avatar', async (req, res) => {
    const user = await User.findById(req.params.id)
    try {
        
        if(!user)
            throw new Error('User not found')

        if(!user.avatar)
            throw new Error('Image does not exist !')
        res.set('content-type','image/png').send(user.avatar)

    } catch (error) {
        res.status(404).send({ error: error.message })
    }
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)
        await req.user.save()
        res.send({ message : 'Successfully logged out !' })
    } catch (error) {
        res.status(500).send()
    }
})

router.post('/users/logoutall', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send({ message : 'You have Successfully logged out of all sessions !' })
    } catch (error) {
        res.status(500).send()
    }
})

// router.get('/users/:id', async (req, res) => {
//     const _id = req.params.id

//     try {
//         const user = await User.findById(_id)    
//         if(!user)
//             return res.status(404).send() 
//         res.send(user)
//     } catch (error) {
//         res.status(500).send(error)
//     }
// })

router.delete('/users/me', auth, async (req, res)=>{
    try {
        const user = await User.findOneAndDelete({ _id: req.user._id })
        if(!user)
            return res.status(404).send()
        res.send(user)
    } catch (error) {
        res.status(400).send()
    }
})

module.exports = router