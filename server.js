const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track' )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


var usersSchema = new Schema({
  username:String,
  userId:String,
  exercise:[{
    description:String,
    duration:Number,
    date:String
  }]
});

var ExerciseUsers = mongoose.model("ExerciseUsers", usersSchema);

// Not found middleware
/*app.use((req, res, next) => {
  res.json({status: 404, message: 'not found'});
})*/

//Array to generate the userId
var symbols = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",0,1,2,3,4,5,6,7,8,9];
//Function to generate the userId
function generateId(){
  var result = "";
  for(let i=0;i<8;i++){
    result += symbols[Math.floor(Math.random()*symbols.length)];
  }
  return result;
};


//Add new user
app.post("/api/exercise/new-user", (req,res,next)=>{
  var userName = req.body.username;
  var newUserId = generateId();
  
  ExerciseUsers.findOne({"username":userName}, (error,data)=>{
    if(error){
      res.send("Error reading database");
    }else{
      if(data==null){
        var newData = new ExerciseUsers({
          username:userName,
          userId:newUserId
        });
        
        newData.save(err=>{
          if(err){
            res.send("Error saving to database");
          }
        });
        
        res.json({"username":userName,"userId":newUserId});
      }else{
        res.send("Username Αlready Εxists");
      }
      
    }
  });  
});

//Add new exercise to existing user
app.post("/api/exercise/add", (req,res,next)=>{
  var inputId = req.body.userId.trim();
  var description = req.body.description.trim();
  var duration = Number(req.body.duration.trim());
  var date = new Date(req.body.date).toUTCString().trim();
  var activity = {"description":description,"duration":duration,"date":date};
  
  if(inputId=="" || description=="" || duration==undefined){
    res.send("All fields are required. Please try again");
  }else{
      ExerciseUsers.findOneAndUpdate({'userId':inputId},{$push:{'exercise':activity}}, (err,data)=>{
      if(err){
        res.send("Cannot update database");
      }else{
        res.json({"username":data.username,"userId":inputId,"description":description,"duration":duration,"date":date});
      }
    },{new:true});
  }
  
});


//Get The Log of Existing User
app.get("/api/exercise/log/:userInput", (req,res,next)=>{
  var userInput = req.params.userInput;
  ExerciseUsers.findOne({"userId":userInput}, (err,data)=>{
    if(data==null){
      res.send("User not found. Please try again.");
    }else{
      var newLog = data.exercise.map(function(x){
        return ({"date":x.date,"duration":x.duration,"description":x.description});
      });
      res.json({"exercise":newLog});
    }
  });
});



// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
