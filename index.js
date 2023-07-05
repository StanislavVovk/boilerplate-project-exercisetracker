const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const {v4: uuidv4} = require('uuid')
const bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({extended: false}))
app.use(cors({optionsSuccessStatus: 200}))
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
});


const users = []
const userData = []

app.post('/api/users', (req, res) => {
    const username = req.body.username
    const _id = uuidv4()
    const user = {"username": username, "_id": _id}
    users.push(user)
    userData.push({...user, count: 0, log: []})
    return res.json(user)
})
app.post('/api/users/:_id/exercises', (req, res) => {
    const id = req.body[":_id"]
    const description = req.body.description
    const duration = Number(req.body.duration)
    const username = (users.find(user => user._id === id))?.username
    if (!username) return res.send({errorMessage: 'No user with this id'})
    const date = req.body.date.length !== 0 ? new Date(req.body.date).toDateString(
    ) : `${new Date().toDateString()}`

    const user = userData.find(user => user._id === id)
    user.count++
    user.log.push({description, duration, date})
    res.send({"_id": id, username, date, duration, description})
})

app.get('/api/users/:_id/logs', (req, res) => {
    const id = req.body[':_id']
    const from = req.query?.from
    const start = from ? new Date(from).getTime() : new Date(0).getTime()

    const to = req.query?.to
    const end = to ? new Date(to).getTime() : new Date().getTime()
    const limit = parseInt(req.query?.limit)

    const user = userData.find(user => user.id === id)
    if (!user) {
        res.status(404)
        return res.json({error: 'User not found'})
    }
    let log = user.log
        .filter((singleLog) => {
            const timestamp = new Date(singleLog.date).getTime()
            return timestamp >= start && timestamp <= end
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (limit !== 0 && !isNaN(limit) && log.length > limit) {
        const newLog = log.slice(0, limit)
        return res.json({...user, count: log.length, log: newLog})
    }
    res.send({...user, count: log.length, log: log})

})

app.get('/api/users', (req, res) => {
    res.send(users)
})

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})
