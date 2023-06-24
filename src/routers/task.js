const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = express.Router()

router.post('/tasks', auth, async (req, res)=> {
    const task = new Task({
        ...req.body,
        creator: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)    
    } catch (error) {
        res.status(400).send(error)
    }    
})

router.get('/tasks', auth, async (req, res) => {
    const match = {creator: req.user._id}
    const projection = null
    const sort = {}

    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1].toLowerCase() === 'asc' ? 1 : -1
    }

    const options = { 
        skip: parseInt(req.query.skip), 
        limit: parseInt(req.query.limit),
        sort
    }

    if(req.query.completed){
        match.completed = req.query.completed === 'true'
    }

    try {
        const tasks = await Task.find(match, projection, options)
        // await req.user.populate({ path: 'tasks', match, options }).execPopulate()
        // res.status(200).send(req.user.tasks)
        res.status(200).send(tasks)
    } catch (error) {
        res.status(500).send(error)
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOne({_id, creator: req.user._id})
        if(!task)
            return res.status(404).send()
        res.send(task)
    } catch (error) {
        res.status(500).send(error)
    }
})

router.patch('/tasks/:id', auth, async (req, res)=> {
    
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send('{ "Error": "Invalid Keys provided !" }')
    }

    try {
        const task = await Task.findOne({_id: req.params.id, creator: req.user._id})
        if(!task)
            return res.status(404).send()
        updates.forEach(update => task[update] = req.body[update])
        await task.save()
        res.send(task)
    } catch (error) {
        res.status(400).send(error)        
    }
})

router.delete('/tasks/:id', auth, async (req, res)=>{
    try {
        const task = await Task.findOneAndDelete({_id: req.params.id, creator: req.user._id})
        if(!task)
            return res.status(404).send()
        res.send(task)
    } catch (error) {
        res.status(400).send()
    }
})

module.exports = router