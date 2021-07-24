const express = require('express');
const router = express.Router();
const Account = require('../models/account');
const { signUp, login, deleteUser, profile, pwCheck } = require('../controllers/auth');
const { isLoggedIn, isNotLoggedIn, isAdmin } = require('../controllers/isAuth');

router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

router.get('/', function (req, res, next) {
    res.render('index', { title: 'Main', name: req.session.name, is_admin: req.session.is_admin });
});

router.get('/login', isNotLoggedIn, function (req, res, next) {
    res.render('login', { title: 'Login' });
});

router.get('/profile', isLoggedIn, async (req, res) => {
    try {
        const user = await Account.findOne(req.session._id);
        res.render('profile', { title: 'Profile', user, });
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/signup', isNotLoggedIn, function (req, res, next) {
    res.render('signup', { title: 'Signup' });
});

router.get("/leave", deleteUser);

router.get('/admin', isAdmin, function (req, res, next) {
    res.render('admin', { title: 'Admin' });
});

router.get('/logout', isLoggedIn, (req, res) => {
    req.session.destroy(function (err) {
        res.redirect('/');
    });
});

router.post("/signup", signUp);
router.post("/login", login);
router.post("/profile", profile);
module.exports = router;
