const express = require('express');
const morgan = require('morgan');
const path = require('path');
const exphbs = require('express-handlebars');
const session = require('express-session');
const bodyParser = require('body-parser');
const { port } = require('./config');

// Intializations
const app = express();

// Settings
app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
    helpers: require('./lib/handlebars')
}))
app.set('view engine', '.hbs');

// Middlewares
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
    secret: 'asd',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 60000 },
}));

app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});

// Global variables
// app.use((req, res, next) => {
//     // app.locals.message = req.flash('message');
//     // app.locals.success = req.flash('success');
//     app.locals.user = req.user;
//     next();
// });

// Routes
app.use(require('./routes/gestion.routes'));

// Public
app.use(express.static(path.join(__dirname, 'public')));


module.exports = app;