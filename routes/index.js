const express = require('express');
const router = express.Router();
const request = require('request');
const mongoose = require('mongoose');
const Trash = require('../models/trash');
const Account = require('../models/account');
const { signUp, login, deleteUser, profile, pwCheck } = require('../controllers/auth');
const { isLoggedIn, isNotLoggedIn, isAdmin } = require('../controllers/isAuth');
const { crawling } = require('../controllers/crawler');


router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

router.get('/', function (req, res, next) {
    if (isLoggedIn) {
        request("https://api.thingspeak.com/channels/1396062/feeds.json?results=1", async (error, response, body) => {
            if (error) {
                console.error('thingspeakData request error:', error);
            }
            var userId = req.session._id;
            var trashData = await Trash.find({ userId: userId }).sort({ "entryId": -1 });
            var data = JSON.parse(body).feeds[0];
            var entryId = data.entry_id;

            // 저장
            if (trashData[0].entryId < entryId) {
                var cnt = entryId - trashData[0].entryId;
                var addUrl = "https://api.thingspeak.com/channels/1396062/feeds.json?results=" + cnt;
                request(addUrl, async (error, response, body) => {
                    for (var i = 0; i < cnt; i++) {
                        var addData = JSON.parse(body).feeds[i];
                        try {
                            // 필드 5678로 변경해야 함
                            var entryId = addData.entry_id;
                            var createdAt = addData.created_at;
                            var canCnt = addData.field1;
                            var glassCnt = addData.field2;
                            var plasticCnt = addData.field3;
                            var totalCnt = addData.field4;

                            const trash = new Trash({
                                _id: new mongoose.Types.ObjectId(),
                                userId: userId,
                                entryId: entryId,
                                can: canCnt,
                                glass: glassCnt,
                                plastic: plasticCnt,
                                total: totalCnt,
                                createdAt: createdAt,
                            });
                            await trash.save();
                        } catch (error) {
                            console.error(error.message);
                        }
                    }

                });
            }

            // 출력
            let can = 0, plastic = 0, total = 0, glass = 0;
            trashData.forEach(element => {
                // 날짜 지우기
                let today = new Date('2021-08-04').toLocaleDateString();
                if (element.createdAt.toLocaleDateString() == today) {
                    can += element.can;
                    plastic += element.plastic;
                    total += element.total;
                    glass += element.glass;
                }
            });

            var todayTrash = [can, glass, plastic, total];
            crawling.then(result => res.render('index', {
                title: 'Main',
                name: req.session.name,
                is_admin: req.session.is_admin,
                article: result,
                todayTrash: todayTrash,
            }));
        });
    }
    // isNotLoggedIn
    else {
        crawling.then(result => res.render('index', {
            title: 'Main',
            name: req.session.name,
            is_admin: req.session.is_admin,
            article: result
        }));
    }
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
