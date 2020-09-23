const express = require('express');
const session = require('express-session');
const { getMaxListeners } = require('process');

var app = express();
//set port
var PORT = process.env.PORT || 3000;

const users = [
  { id: 1, name: 'Jed', email: 'jed@gmail.com', password: '123' },
  { id: 2, name: 'Jill', email: 'jill@gmail.com', password: '123' },
  { id: 3, name: 'Moe', email: 'moe@gmail.com', password: '123' }
]

const {
  SESS_NAME = "sid",
  SESSION_SECRET = "SessionTest1",
  NODE_ENV = "development"
} = process.env;

const IN_PROD = NODE_ENV === "production";

app.use(session({
  name: SESS_NAME,
  resave: false,
  saveUninitialized: false,
  secret: SESSION_SECRET,
  cookie: {
    maxAge: 1000 * 60 * 60 * 2,
    sameSite: true,
    secure: IN_PROD
  }
}))

//set up a log for request and response
// app.use(logger("dev"));

// Sets up the Express app to parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());




//Middleware for added security

//if user user is not authenticated, redirect to login.
const redirectLogin = (req, res, next) => {
    if (!req.session.userId) {
      res.redirect('/login')
    }
    else {
      next();
    }
  }
  
  //if user is authenticated, redirect user to Home page.
  const redirectHome = (req, res, next) => {
    if (req.session.userId) {
      res.redirect('/home')
    }
    else {
      next();
    }
  }
  
  //a dynamic middleware that allows you use req.session to find data about user based on userId and put into res.locals
  app.use((req, res, next) => {
    const { userId }= req.session;
    if(userId){
      //locals is an object shared among middleware.  can put custom logic into locals
      res.locals.user =  users.find(user => user.id === userId)
    }
    next();
  });
  
  // using "blank" instead of "/", because Welm app is using "/".
  app.get('/blank', (req, res) => {
    // const { userId } = req.session;
    const userId = 1;
    console.log(userId);
  
    res.send(`<h1>Welcome</h1>
     ${ userId ? `
     <a href='/home'>Home</a> 
     <form method='post' action='logout'> 
     <button>logout</button> </form>
     ` : `
     <a href='/login'>Login</a>
     <a href='/register'>register</a>
     `}
     `)
  });
  
  //if user is not authenticated, the user cannot access /home.
  app.get('/home', redirectLogin, (req, res) => {
    const { user } = res.locals;
    console.log("user home route", user);
  
    res.send(`
    <h1>Home>
    <a href='/blank'>blank</a>
    <ul>
      <li>name: ${ user.name } </li>
      <li>email: ${ user.email } </li>
    </ul>
    `)
  
  });
  
  //If user is authenticated, redirectHome will redirect user home page.  Cannot access /login.  Doesn't make sense to go to login. 
  app.get('/login', redirectHome, (req, res) => {
    res.send(`
    <h1>login</h1>
    <form method='post' action='login'>
    <input type='email' name='email' placeholder='email' required>
    <input type='password' name='password' placeholder='password' required>
    <input type='submit' />
    </form>
    <a href='/register'>Register</a>
    `)
  
  
  });
  //If user is authenticated, that means they have registered.  RedirectHome will redirect user home page.  Doesn't make sense to go to register page. 
  app.get('/register', redirectHome, (req, res) => {
    res.send(`
    <h1>Register</h1>
    <form method='post' action='/register'>
    <input name='name' placeholder='name' required>
    <input type='email' name='email' placeholder='email' required>
    <input type='password' name='password' placeholder='password' required>
    <input type='submit' />
    </form>
    <a href='/login'>Login</a>
    `)
  });
  
  //allows user to login if user is not authenticated.  Otherwise redirect home.
  app.post('/login', redirectHome, (req, res) => {
    
    var user;
    const { email, password } = req.body;
    if (email && password) {
      user = users.find(user => user.email === email && user.password === password)
      console.log("email and password authed", email, password);
      console.log("user", user);
    }
    if (user) {
      //creates session cookie
      req.session.userId = user.id
      console.log("user.id", user.id);
      return res.redirect('/home');
    }
    res.redirect('/login');
  });
  
  //allows use to create a new user if user is not authenticated.  Otherwise redirect home.
  // redirectHome,
  app.post('/register',  (req, res) => {
    const { name, email, password } = req.body;
    console.log("req.body", req.body);
  
    if (name && email && password) {
      const exists = users.some(user => user.email === email)
  
      if (!exists) {
        const user = {
          id: users.length + 1,
          name,
          email,
          password
        }
        console.log("register user", user);
        users.push(user);
        //creates a session cookie
        req.session.userId = user.id;
  
        //return terminates the if statement
        return res.redirect('/home');
      }
    }
  
    //if any validation fails of user already exists, redirect to register
    res.redirect('/register');
  });
  
  //If user logs out, they are no longer authenticated so redirect to Login page.
  app.post('/logout', redirectLogin, (req, res) =>{
    req.session.destroy(err => {
      if(err) {
        console.log("logout error", err);
        return res.redirect('/home');
      }
      console.log(SESS_NAME);
      //clear cookie then redirect to login
      res.clearCookie(SESS_NAME);
      res.redirect('/login');
    })
  });

  app.listen(PORT, function () {
    console.log("App listening on PORT " + PORT);
  });
