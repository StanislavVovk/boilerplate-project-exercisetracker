const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const {v4: uuidv4} = require('uuid')
const bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({extended: false}))
app.use(cors())
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
    const duration  = Number(req.body.duration)
    const username = (users.find(user => user._id === id))?.username
    if (!username) return res.send({errorMessage: 'No user with this id'})
    const date =  req.body.date.length !== 0 ? new Date(req.body.date).toLocaleDateString('en-US', {weekday: 'short', year: 'numeric', month: 'short', day:'numeric'}) : `${new Date().toLocaleDateString('en-US', {weekday: 'short', year: 'numeric', month: 'short', day:'numeric'})}`

    const user = userData.find(user => user._id === id)
    user.count++
    user.log.push({description, duration, date})
    res.send({id, username, description, duration, date})
})

app.get('/api/users/:_id/logs', (req, res) => {
    const id = req.body[':_id']
    res.send(userData.find(user => user.id === id))
})

app.get('/api/users', (req, res) => {
    res.send(users)
})

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})
