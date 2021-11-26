const express = require('express');
const router = express.Router();
const request = require('request');
const mongoose = require('mongoose');
const moment = require('moment');
const Trash = require('../models/trash');
const Account = require('../models/account');
const {signUp, login, deleteUser, profile} = require('../controllers/auth');
const {isLoggedIn, isNotLoggedIn, isAdmin} = require('../controllers/isAuth');
const {newsCrawling, weatherCrawling} = require('../controllers/crawler');


router.use((req, res, next) => {
    res.locals.name = req.session.name;
    res.locals.is_admin = req.session.is_admin
    res.locals.page = req.query.page;
    next();
});

router.get('/test', async (req, res, next) => {
    res.send();
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
            var trashData = await Trash.find({userId: userId}).sort({"entryId": -1});
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
                                var entryId = addData.entry_id;
                                var createdAt = addData.created_at;
                                var canCnt = addData.field1;
                                var glassCnt = addData.field2;
                                var plasticCnt = addData.field3;
                                var totalCnt = addData.field4;

                                const trash = new Trash({
                                    _id: new mongoose.Types.ObjectId(),
                                    userId: mongoose.Types.ObjectId(userId),
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
                                    userId: mongoose.Types.ObjectId(userId),
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
            const today = moment().format('YYYY-MM-DD');
            const week = moment().startOf('isoweek').subtract(1, 'd').format('YYYY-MM-DD');
            const month = moment().startOf('month').subtract(1, 'd').format('YYYY-MM-DD');
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

router.get('/login', isNotLoggedIn, (req, res, next) => {
    res.render('users/login', {title: 'Login'});
});

router.get('/profile', isLoggedIn, async (req, res) => {
    try {
        const user = await Account.findOne(req.session._id);
        res.render('users/profile', {title: 'Profile', user,});
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/signup', isNotLoggedIn, (req, res, next) => {
    res.render('users/signup', {title: 'Signup'});
});

router.get("/leave", deleteUser);

router.get('/week', isLoggedIn, async (req, res, next) => {

    var userId = req.session._id;
    var trashData = await Trash.find({userId: userId}).sort({"entryId": -1});
    // 금주
    let weekCan = 0, weekPlastic = 0, weekTotal = 0, weekGlass = 0;
    const week = moment().startOf('isoweek').subtract(1, 'd').format('YYYY-MM-DD');
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

    res.render('week', {
        title: 'week | PAM',
        weekTrash: weekTrash,
    })
});

router.get('/month', isLoggedIn, async (req, res, next) => {

    var userId = req.session._id;
    var trashData = await Trash.find({n}).sort({"entryId": -1});
    // 금월
    let monthCan = 0, monthPlastic = 0, monthTotal = 0, monthGlass = 0;
    const month = moment().startOf('month').subtract(1, 'd').format('YYYY-MM-DD');
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


    res.render('month', {
        title: 'month | PAM',
        monthTrash: monthTrash,
    })
});

router.get('/monthly', isLoggedIn, async (req, res, next) => {

    var userId = req.session._id;
    // 월별
    let matchId = mongoose.Types.ObjectId(userId);
    var monthlyTrash = await Trash.aggregate([
        {
            $match: {userId: matchId}
        },
        {
            $group: {
                _id: {
                    $let: {
                        vars: {
                            local_time: {
                                $subtract: [
                                    '$createdAt',
                                    -32400000
                                ]
                            }
                        },
                        in: {
                            year: {$year: '$$local_time'},
                            month: {$month: '$$local_time'},
                        }
                    }
                },
                can: {$sum: '$can'},
                glass: {$sum: '$glass'},
                plastic: {$sum: '$plastic'},
                total: {$sum: '$total'},
            }
        }, {$sort: {"_id.year": 1, "_id.month": 1, "_id.day": 1}}
    ]);

    res.render('monthly', {
        title: 'monthly | PAM',
        monthlyTrash: monthlyTrash,
    })
});

router.get('/ranking', isLoggedIn, async (req, res, next) => {
    var tab = req.query.tab;
    const today = moment().format('YYYY-MM-DD');
    const week = moment().startOf('isoweek').subtract(1, 'd').format('YYYY/MM/DD');
    const month = moment().startOf('month').subtract(1, 'd').format('YYYY-MM-DD');

    if (tab == "today") {
        var rankingData = await Trash.aggregate([
            {
                $match: {createdAt: {"$gte": new Date(today)}}
            },
            {
                $group: {
                    _id: '$userId',
                    can: {$sum: '$can'},
                    glass: {$sum: '$glass'},
                    plastic: {$sum: '$plastic'},
                    total: {$sum: '$total'},
                }
            },
            {
                $sort: {"total": -1}
            },
            {
                $limit: 20
            }
        ]);
    } else if (tab == "week") {
        var rankingData = await Trash.aggregate([
            {
                $match: {createdAt: {"$gte": new Date(week)}}
            },
            {
                $group: {
                    _id: '$userId',
                    can: {$sum: '$can'},
                    glass: {$sum: '$glass'},
                    plastic: {$sum: '$plastic'},
                    total: {$sum: '$total'},
                }
            },
            {
                $sort: {"total": -1}
            },
            {
                $limit: 20
            }
        ]);
    } else if (tab == "month") {
        var rankingData = await Trash.aggregate([
            {
                $match: {createdAt: {"$gte": new Date(month)}}
            },
            {
                $group: {
                    _id: '$userId',
                    can: {$sum: '$can'},
                    glass: {$sum: '$glass'},
                    plastic: {$sum: '$plastic'},
                    total: {$sum: '$total'},
                }
            },
            {
                $sort: {"total": -1}
            },
            {
                $limit: 20
            }
        ]);
    } else if (tab == "all") {
        var rankingData = await Trash.aggregate([
            {
                $group: {
                    _id: '$userId',
                    can: {$sum: '$can'},
                    glass: {$sum: '$glass'},
                    plastic: {$sum: '$plastic'},
                    total: {$sum: '$total'},
                }
            },
            {
                $sort: {"total": -1}
            },
            {
                $limit: 20
            }
        ]);
    } else {
        var rankingData = await Trash.aggregate([
            {
                $match: {createdAt: {"$gte": new Date(today)}}
            },
            {
                $group: {
                    _id: '$userId',
                    can: {$sum: '$can'},
                    glass: {$sum: '$glass'},
                    plastic: {$sum: '$plastic'},
                    total: {$sum: '$total'},
                }
            },
            {
                $sort: {"total": -1}
            },
            {
                $limit: 20
            }
        ]);

    }

    for (i = 0; i < rankingData.length; i++) {
        var userId = mongoose.Types.ObjectId(rankingData[i]._id);
        var user = await Account.findById({_id: userId});
        rankingData[i].email = user.email;
        if (userId.equals(req.session._id)) {
            var rank = i + 1;
        }
    }

    res.render('ranking', {
        title: 'ranking | PAM',
        rankingData: rankingData,
        rank: rank,
    })
});

router.get('/data', isLoggedIn, (req, res, next) => {
    try {
        request("https://api.thingspeak.com/channels/1396062/feeds.json?results=1", async (error, response, body) => {
            if (error) {
                console.error('thingspeakData request error:', error);
            }
            var userId = req.session._id;
            // 출력
            let can = 0, plastic = 0, total = 0, glass = 0;
            var trashData = await Trash.find({userId: userId}).sort({"entryId": -1});
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

router.get('/news', (req, res, next) => {
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
    if (req.query.page) {
        var page = req.query.page;
    } else {
        var page = 1;
    }
    var tab = req.query.tab;
    const today = moment().format('YYYY-MM-DD');
    const week = moment().startOf('isoweek').subtract(1, 'd').format('YYYY/MM/DD');
    const month = moment().startOf('month').subtract(1, 'd').format('YYYY-MM-DD');

    if (tab == "today") {
        var trashData = await Trash.aggregate([
            {
                $match: {createdAt: {"$gte": new Date(today)}}
            },
            {
                $group: {
                    _id: '$userId',
                    can: {$sum: '$can'},
                    glass: {$sum: '$glass'},
                    plastic: {$sum: '$plastic'},
                    total: {$sum: '$total'},
                }
            }
        ]);
    } else if (tab == "week") {
        var trashData = await Trash.aggregate([
            {
                $match: {createdAt: {"$gte": new Date(week)}}
            },
            {
                $group: {
                    _id: '$userId',
                    can: {$sum: '$can'},
                    glass: {$sum: '$glass'},
                    plastic: {$sum: '$plastic'},
                    total: {$sum: '$total'},
                }
            }
        ]);
    } else if (tab == "month") {
        var trashData = await Trash.aggregate([
            {
                $match: {createdAt: {"$gte": new Date(month)}}
            },
            {
                $group: {
                    _id: '$userId',
                    can: {$sum: '$can'},
                    glass: {$sum: '$glass'},
                    plastic: {$sum: '$plastic'},
                    total: {$sum: '$total'},
                }
            }
        ]);
    } else if (tab == "all") {
        var trashData = await Trash.aggregate([
            // {$match: {dateOfDay: {$gte: new Date('12/01/2014'), $lt:new Date('12/30/2014')}}},
            {
                $group: {
                    _id: '$userId',
                    can: {$sum: '$can'},
                    glass: {$sum: '$glass'},
                    plastic: {$sum: '$plastic'},
                    total: {$sum: '$total'},
                    // avg: {$avg: '$can'}
                }
            }
        ]);
    } else {
        var trashData = await Trash.aggregate([
            {
                $match: {createdAt: {"$gte": new Date(today)}}
            },
            {
                $group: {
                    _id: '$userId',
                    can: {$sum: '$can'},
                    glass: {$sum: '$glass'},
                    plastic: {$sum: '$plastic'},
                    total: {$sum: '$total'},
                }
            }
        ]);
    }

    for (i = 0; i < trashData.length; i++) {
        var userId = trashData[i]._id;
        var user = await Account.findById({_id: mongoose.Types.ObjectId(userId)});
        trashData[i].email = user.email;
        trashData[i].super = user.super;
    }
    res.render('admin', {
        title: 'admin',
        trashData: trashData,
        page: page,
        page_num: 5,
        max_page: Math.floor(trashData.length / 5) + 1,
        start_page: (Math.ceil(page / 10) * 10 - 10) + 1
    });
});

router.get('/detail', isAdmin, async (req, res, next) => {
    const user = await Account.findById(req.query.id);
    const channel = user.channel;
    request("https://api.thingspeak.com/channels/" + channel + "/feeds.json?results=1", async (error, response, body) => {
        if (error) {
            console.error('thingspeakData request error:', error);
        }
        var userId = req.query.id;
        var trashData = await Trash.find({userId: userId}).sort({"entryId": -1});
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
                            var entryId = addData.entry_id;
                            var createdAt = addData.created_at;
                            var canCnt = addData.field1;
                            var glassCnt = addData.field2;
                            var plasticCnt = addData.field3;
                            var totalCnt = addData.field4;

                            const trash = new Trash({
                                _id: new mongoose.Types.ObjectId(),
                                userId: mongoose.Types.ObjectId(userId),
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
                                userId: mongoose.Types.ObjectId(userId),
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
        const today = moment().format('YYYY-MM-DD');
        const week = moment().startOf('isoweek').subtract(1, 'd').format('YYYY-MM-DD');
        const month = moment().startOf('month').subtract(1, 'd').format('YYYY-MM-DD');
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

        // 금주
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

        // 금월
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

        // 월별
        let matchId = mongoose.Types.ObjectId(userId);
        var monthlyTrash = await Trash.aggregate([
            {
                $match: {userId: matchId}
            },
            {
                $group: {
                    _id: {
                        $let: {
                            vars: {
                                local_time: {
                                    $subtract: [
                                        '$createdAt',
                                        -32400000
                                    ]
                                }
                            },
                            in: {
                                year: {$year: '$$local_time'},
                                month: {$month: '$$local_time'},
                            }
                        }
                    },
                    can: {$sum: '$can'},
                    glass: {$sum: '$glass'},
                    plastic: {$sum: '$plastic'},
                    total: {$sum: '$total'},
                }
            }, {$sort: {"_id.year": 1, "_id.month": 1, "_id.day": 1}}
        ]);


        res.render('detail', {
            title: 'admin | detail',
            email: user.email,
            todayTrash: todayTrash,
            weekTrash: weekTrash,
            monthTrash: monthTrash,
            monthlyTrash: monthlyTrash,
        })
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
router.post("/send_data", async (req, res) => {
    if (req.body.userId) {
        var userId = req.body.userId;
    } else {
        var userId = req.session._id;
    }
    var year = req.body.year;
    var month = req.body.month;
    if (year && month) {
        let matchId = mongoose.Types.ObjectId(userId);
        var dayOfMonthTrash = await Trash.aggregate([
            {
                $match: {
                    $and: [
                        {
                            userId: matchId
                        },
                        {
                            $expr: {
                                $and: [
                                    {$eq: [{$year: '$createdAt'}, {$year: new Date(year - 0, month - 0, 0)}]},
                                    {$eq: [{$month: '$createdAt'}, {$month: new Date(0, month - 0, 0)}]},
                                ],
                            },
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        $let: {
                            vars: {
                                local_time: {
                                    $subtract: [
                                        '$createdAt',
                                        -32400000
                                    ]
                                }
                            },
                            in: {
                                year: {$year: '$$local_time'},
                                month: {$month: '$$local_time'},
                                day: {$dayOfMonth: '$$local_time'}
                            }
                        }
                    },
                    can: {$sum: '$can'},
                    glass: {$sum: '$glass'},
                    plastic: {$sum: '$plastic'},
                    total: {$sum: '$total'},
                }
            }, {$sort: {"_id.year": 1, "_id.month": 1, "_id.day": -1}}
        ]);
        res.send({dayOfMonthTrash: dayOfMonthTrash});
    }

})
router.post("/sort_data", async (req, res) => {
    var col = req.body.col;
    var sort = req.body.sort;
    if (col == "total") {
        var trashData = await Trash.aggregate([
            {
                $group: {
                    _id: '$userId',
                    can: {$sum: '$can'},
                    glass: {$sum: '$glass'},
                    plastic: {$sum: '$plastic'},
                    total: {$sum: '$total'},
                }
            }, {$sort: {total: sort - 0}}
        ]);
    } else if (col == "can") {
        var trashData = await Trash.aggregate([
            {
                $group: {
                    _id: '$userId',
                    can: {$sum: '$can'},
                    glass: {$sum: '$glass'},
                    plastic: {$sum: '$plastic'},
                    total: {$sum: '$total'},
                }
            }, {$sort: {can: sort - 0}}
        ]);
    } else if (col == "plastic") {
        var trashData = await Trash.aggregate([
            {
                $group: {
                    _id: '$userId',
                    can: {$sum: '$can'},
                    glass: {$sum: '$glass'},
                    plastic: {$sum: '$plastic'},
                    total: {$sum: '$total'},
                }
            }, {$sort: {plastic: sort - 0}}
        ]);
    } else if (col == "glass") {
        var trashData = await Trash.aggregate([
            {
                $group: {
                    _id: '$userId',
                    can: {$sum: '$can'},
                    glass: {$sum: '$glass'},
                    plastic: {$sum: '$plastic'},
                    total: {$sum: '$total'},
                }
            }, {$sort: {glass: sort - 0}}
        ]);
    }
    for (i = 0; i < trashData.length; i++) {
        var userId = trashData[i]._id;
        var user = await Account.findById({_id: mongoose.Types.ObjectId(userId)});
        trashData[i].email = user.email;
        trashData[i].super = user.super;
    }
    res.send({trashData: trashData});
})


module.exports = router;
