const express = require('express');
const router = express.Router();
const request = require('request');
const mongoose = require('mongoose');
const moment = require('moment');
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


router.get('/', async (req, res, next) => {
    if (req.session.name === undefined) {
        var todayTrash = [0, 0, 0, 0];
        newsCrawling.then(news => {
            weatherCrawling.then(weather => {
                res.render('index', {
                    title: 'PAM',
                    article: news,
                    weather: weather,
                    name: req.session.name,
                    is_admin: req.session.is_admin,
                    todayTrash: todayTrash,
                })
            })
        });
    }
    // LoggedIn
    else {
        var user = await Account.findById(req.session._id);
        const channel = user.channel;
        request("https://api.thingspeak.com/channels/" + channel + "/feeds.json?results=1", async (error, response, body) => {
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
                    request("https://api.thingspeak.com/channels/" + channel + "/feeds.json", async (error, response, body) => {
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
                    var addUrl = "https://api.thingspeak.com/channels/" + channel + "/feeds.json?results=" + cnt;

                    request(addUrl, async (error, response, body) => {
                        for (var i = 0; i < cnt; i++) {
                            var addData = JSON.parse(body).feeds[i];
                            try {
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
            var trashData = await Trash.find({ userId: userId }).sort({ "entryId": -1 });


            const today = moment().format('YYYY-MM-DD');
            const week = moment().subtract(1, 'w').subtract(1, 'd').format('YYYY-MM-DD');
            const month = moment().subtract(1, 'M').subtract(1, 'd').format('YYYY-MM-DD');
            // 당일
            let todayCan = 0, todayPlastic = 0, todayTotal = 0, todayGlass = 0;
            trashData.forEach(element => {
                const target = moment(element.createdAt).format('YYYY-MM-DD');
                if (target === today) {
                    todayCan += element.can;
                    todayPlastic += element.plastic;
                    todayTotal += element.total;
                    todayGlass += element.glass;
                }
            });
            var todayTrash = [todayCan, todayPlastic, todayTotal, todayGlass];

            // 주간
            let weekCan = 0, weekPlastic = 0, weekTotal = 0, weekGlass = 0;
            trashData.forEach(element => {
                const target = moment(element.createdAt).format('YYYY-MM-DD');
                if (moment(target).isAfter(week)) {
                    weekCan += element.can;
                    weekPlastic += element.plastic;
                    weekTotal += element.total;
                    weekGlass += element.glass;
                }
            });
            var weekTrash = [weekCan, weekPlastic, weekGlass, weekTotal];

            // 월간
            let monthCan = 0, monthPlastic = 0, monthTotal = 0, monthGlass = 0;
            trashData.forEach(element => {
                const target = moment(element.createdAt).format('YYYY-MM-DD');
                if (moment(target).isAfter(month)) {
                    monthCan += element.can;
                    monthPlastic += element.plastic;
                    monthTotal += element.total;
                    monthGlass += element.glass;
                }
            });
            var monthTrash = [monthCan, monthPlastic, monthGlass, monthTotal];

            newsCrawling.then(news => {
                weatherCrawling.then(weather => {
                    res.render('index', {
                        title: 'PAM',
                        name: req.session.name,
                        is_admin: req.session.is_admin,
                        article: news,
                        todayTrash: todayTrash,
                        weekTrash: weekTrash,
                        weather: weather
                    })
                })
            });
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
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/signup', isNotLoggedIn, function (req, res, next) {
    res.render('users/signup', { title: 'Signup' });
});

router.get("/leave", deleteUser);


router.get('/data', function (req, res, next) {
    try {
        request("https://api.thingspeak.com/channels/1396062/feeds.json?results=1", async (error, response, body) => {
            if (error) {
                console.error('thingspeakData request error:', error);
            }
            var userId = req.session._id;
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
            res.render('data', {
                title: '쓰레기 배출량',
                name: req.session.name,
                is_admin: req.session.is_admin,
                todayTrash: todayTrash,
            })
        })
    } catch (error) {
        console.error(error.message);
    }
});

router.get('/news', function (req, res, next) {
    var todayTrash = [0, 0, 0, 0];
    newsCrawling.then(news => {
        weatherCrawling.then(weather => {
            res.render('news', {
                title: '환경 뉴스',
                article: news,
                weather: weather,
                name: req.session.name,
                is_admin: req.session.is_admin,
                todayTrash: todayTrash,
            })
        })
    });
});

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
                // avg: {$avg: '$can'}
            }
        }
    ]);
    for (i = 0; i < trashData.length; i++) {
        var userId = trashData[i]._id;
        var user = await Account.findById({ _id: mongoose.Types.ObjectId(userId) });
        trashData[i].email = user.email;
        trashData[i].super = user.super;
    }
    res.render('admin', {
        title: 'admin',
        trashData: trashData,
    });
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
