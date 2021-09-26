const express = require('express');
const router = express.Router();
const request = require('request');
const mongoose = require('mongoose');
const Trash = require('../models/trash');
const Account = require('../models/account');
const { signUp, login, deleteUser, profile } = require('../controllers/auth');
const { isLoggedIn, isNotLoggedIn, isAdmin } = require('../controllers/isAuth');
const { newsCrawling, weatherCrawling } = require('../controllers/crawler');


router.use((req, res, next) => {
    res.locals.name = req.session.name;
    res.locals.is_admin = req.session.is_admin
    next();
});

router.get('/a', function (req, res, next) {
    newsCrawling.then(aa => {
        weatherCrawling.then(aaaa => {
            console.log(aa);
            console.log(aaaa);
        })
    });
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
            try {
                // 처음 사용한 user
                if (trashData.length == 0) {
                    request("https://api.thingspeak.com/channels/1396062/feeds.json", async (error, response, body) => {
                        var data = JSON.parse(body).feeds;
                        for (var i = 0; i < Object.keys(data).length; i++) {
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
                        console.log("New data saved!")
                    });
                }
                // 기존 user
                else if (trashData[0].entryId < entryId) {
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
            } catch (error) {
                console.error(error.message);
            }

            // 출력
            let can = 0, plastic = 0, total = 0, glass = 0;
            var trashData = await Trash.find({ userId: userId }).sort({ "entryId": -1 });
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
            newsCrawling.then(news => {
                weatherCrawling.then(weather => {
                    res.render('index', {
                        title: 'Main',
                        name: req.session.name,
                        is_admin: req.session.is_admin,
                        article: news,
                        todayTrash: todayTrash,
                        weather: weather
                    })
                })
            });
        });
    }
    // isNotLoggedIn
    else {
        newsCrawling.then(news => {
            weatherCrawling.then(weather => {
                res.render('index', {
                    title: 'Main',
                    article: news,
                    weather: weather
                })
            })
        });
    }
});

router.get('/login', isNotLoggedIn, function (req, res, next) {
    res.render('users/login', { title: 'Login' });
});

router.get('/profile', isLoggedIn, async (req, res) => {
    try {
        const user = await Account.findOne(req.session._id);
        res.render('users/profile', { title: 'Profile', user, });
    }
    catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/signup', isNotLoggedIn, function (req, res, next) {
    res.render('users/signup', { title: 'Signup' });
});

router.get("/leave", deleteUser);

router.get('/admin', isAdmin, async (req, res, next) => {

    var trashData = await Trash.aggregate([
        // {$match: {dateOfDay: {$gte: new Date('12/01/2014'), $lt:new Date('12/30/2014')}}},
        {
            $group: {
                _id: '$userId',
                can: { $sum: '$can' },
                glass: { $sum: '$glass' },
                plastic: { $sum: '$plastic' },
                total: { $sum: '$total' },
                count: { $sum: 1 },
                avg: { $avg: '$can' }
            }
        }
    ]);
    for (i = 0; i < trashData.length; i++) {
        var userEmail = trashData[i]._id;
        var user = await Account.findById(req.session._id);
        trashData[i]._id = user.email;
    }
    res.send(trashData);
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
