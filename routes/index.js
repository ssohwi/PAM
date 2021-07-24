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

router.get('/test_signup', isNotLoggedIn, function (req, res, next) {
    res.render('test_signup', { title: 'SignUp' });
});
router.get('/test_login', isNotLoggedIn, function (req, res, next) {
    res.render('test_login', { title: 'login' });
});
router.get('/test_main', isNotLoggedIn, function (req, res, next) {
    res.render('test_main', { title: 'test_main' });
});
router.get('/test_data', isNotLoggedIn, function (req, res, next) {
    res.render('test_data', { title: 'test_data' });
});
router.get('/test_eninfo', isNotLoggedIn, function (req, res, next) {
    res.render('test_eninfo', { title: 'test_eninfo' });
});
router.get('/test_userint', isNotLoggedIn, function (req, res, next) {
    res.render('test_userint', { title: 'test_userint' });
});
router.get('/test_bootstrap', isNotLoggedIn, function (req, res, next) {
    res.render('test_bootstrap', { title: 'test_bootstrap' });
});
router.get('/test_bootstrap_narrow', isNotLoggedIn, function (req, res, next) {
    res.render('test_bootstrap_narrow', { title: 'test_bootstrap_narrow' });
});
router.get('/test2', isNotLoggedIn, function (req, res, next) {
    res.render('test2', { title: 'test2' });
});
router.get('/test_mlogin', isNotLoggedIn, function (req, res, next) {
    res.render('test_mlogin', { title: 'test_mlogin' });
});
router.get('/test_msignup', isNotLoggedIn, function (req, res, next) {
    res.render('test_msignup', { title: 'test_msignup' });
});
router.get('/test_mmain', isNotLoggedIn, function (req, res, next) {
    res.render('test_mmain', { title: 'test_mmain' });
});
router.get('/test_mprofile', isNotLoggedIn, function (req, res, next) {
    res.render('test_mprofile', { title: 'test_mprofile' });
});
router.get('/test_mdata', isNotLoggedIn, function (req, res, next) {
    res.render('test_mdata', { title: 'test_mdata' });
});
router.get('/test_madmsg', isNotLoggedIn, function (req, res, next) {
    res.render('test_madmsg', { title: 'test_madmsg' });
});
router.get('/test_meninfo', isNotLoggedIn, function (req, res, next) {
    res.render('test_meninfo', { title: 'test_meninfo' });
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
