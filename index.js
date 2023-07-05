const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let bodyParser = require('body-parser');

let mongoose;
try {
    mongoose = require("mongoose");
} catch (e) {
    console.log(e);
}

// Mongoose Set Up
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const Schema = mongoose.Schema;

// User
const userSchema = new Schema({
    username: { type: String, required: true }
})
let userModel = mongoose.model("user", userSchema);

// Exercise
const exerciseSchema = new Schema({
    userId: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, default: new Date() }
})
let exerciseModel = mongoose.model("exercise", exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use("/", bodyParser.urlencoded({ extended: false }));

const {v4: uuidv4} = require('uuid')
const bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({extended: false}))
app.use(cors({optionsSuccessStatus: 200}))
app.use(express.static('public'))


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
    let username = req.body.username;
    let newUser = new userModel({ username: username });
    newUser.save();
    res.json(newUser);
})

app.get('/api/users', (req, res) => {
    userModel.find({}).then((users) => {
        res.json(users);
    })
})

app.post('/api/users/:_id/exercises', (req, res) => {
    console.log(req.body);


    let userId = req.params._id;

    exerciseObj = {
        userId: userId,
        description: req.body.description,
        duration: req.body.duration
    }

    // If there is a date add it to the object
    if (req.body.date != ''){
        exerciseObj.date = req.body.date
    }

    let newExercise = new exerciseModel(exerciseObj);

    userModel.findById(userId, (err, userFound) => {
        if (err) console.log(err);

        newExercise.save();
        res.json({
            _id: userFound._id, username: userFound.username,
            description: newExercise.description, duration: newExercise.duration,
            date: new Date(newExercise.date).toDateString()
        })
    })
})

app.get('/api/users/:_id/logs', (req, res) => {

    let fromParam = req.query.from;
    let toParam = req.query.to;
    let limitParam = req.query.limit;
    let userId = req.params._id;

    // If limit param exists set it to an integer
    limitParam = limitParam ? parseInt(limitParam): limitParam

    userModel.findById(userId, (err, userFound) => {
        if (err) return console.log(err);
        console.log(userFound);

        let queryObj = {
            userId: userId
        };
        // If we have a date add date params to the query
        if (fromParam || toParam){

            queryObj.date = {}
            if (fromParam){
                queryObj.date['$gte'] = fromParam;
            }
            if (toParam){
                queryObj.date['$lte'] = toParam;
            }
        }


        exerciseModel.find(queryObj).limit(limitParam).exec((err, exercises) => {
            if (err) return console.log(err);

            let resObj =
                {_id: userFound._id,
                    username: userFound.username
                }

            exercises = exercises.map((x) => {
                return {
                    description: x.description,
                    duration: x.duration,
                    date: new Date(x.date).toDateString()
                }
            })
            resObj.log = exercises;
            resObj.count = exercises.length;

            res.json(resObj);
        })

    })
})


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
    const date = req.body.date.length !== 0 ? new Date(req.body.date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }) : `${new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })}`

    const user = userData.find(user => user._id === id)
    user.count++
    user.log.push({description, duration, date})
    res.json({"_id": id, username, description, duration, date})
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
    res.json({...user, count: log.length, log: log})

})

app.get('/api/users', (req, res) => {
    res.send(users)
})


const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})
