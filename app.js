const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const dotenv = require('dotenv');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const indexRouter = require('./routes');
const connect = require('./models')

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// db 연결
connect();

// .env 파일 설정
dotenv.config();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(`${__dirname}/node_modules/bootstrap/dist/css`));
app.use('/js', express.static(`${__dirname}/node_modules/bootstrap/dist/js`));

// session 설정
app.use(session({
  secret: process.env.COOKIE_SECRET, // 이 값을 이용해 암호화옵션
  resave: false, // 세션이 수정되지 않아도 항상 저장할지 확인하는 옵션
  saveUninitialized: true, // 세션이 uninitalized 상태로 미리 만들어서 저장하는지 묻는 옵션
  store: new MongoDBStore({  // 세션이 서버 메모리가 아닌 어떤 저장소에 들어갈지 정하는 옵션
    url: "mongodb://localhost:27017/account", // 데이터베이스 url
    databaseName: 'account', // 데이터베이스 name
    collection: 'sessions', // 콜렉션 이름
    ttl: 60 * 60 // 60분후 폭파
  }),
  cookie: { // 쿠키에 들어가는 세션 ID값의 옵션
    maxAge: 1000 * 60 * 60, // 60분후 폭파
    httpOnly: true, // https가 아닌 http 만
    secure: false,
  }
}));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
