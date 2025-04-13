const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { v4: uuidv4 } = require('uuid')
const bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors({ optionsSuccessStatus: 200 }))
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
})

const users = []
const userData = []

app.post('/api/users', (req, res) => {
    const username = req.body.username
    const _id = uuidv4()
    const user = { username, _id }
    users.push(user)
    userData.push({ ...user, count: 0, log: [] })
    res.json(user)
})

app.post('/api/users/:_id/exercises', (req, res) => {
    const id = req.params._id
    const description = req.body.description
    const duration = Number(req.body.duration)

    const username = users.find(user => user._id === id)?.username
    if (!username) return res.status(400).json({ error: 'No user with this id' })

    const date = req.body.date
        ? new Date(req.body.date).toDateString()
        : new Date().toDateString()

    const user = userData.find(user => user._id === id)
    user.count++
    user.log.push({ description, duration, date })

    res.json({
        _id: id,
        username,
        date,
        duration,
        description
    })
})

app.get('/api/users/:_id/logs', (req, res) => {
    const id = req.params._id
    const from = req.query.from
    const to = req.query.to
    const limit = parseInt(req.query.limit)

    const user = userData.find(user => user._id === id)
    if (!user) {
        return res.status(404).json({ error: 'User not found' })
    }

    let log = user.log.filter(entry => {
        const entryTime = new Date(entry.date).getTime()
        const fromTime = from ? new Date(from).getTime() : 0
        const toTime = to ? new Date(to).getTime() : Date.now()
        return entryTime >= fromTime && entryTime <= toTime
    })

    if (!isNaN(limit)) {
        log = log.slice(0, limit)
    }

    res.json({
        _id: user._id,
        username: user.username,
        count: log.length,
        log: log.map(entry => ({
            description: entry.description,
            duration: entry.duration,
            date: entry.date
        }))
    })
})

app.get('/api/users', (req, res) => {
    res.json(users)
})

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})
