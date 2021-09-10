const Trash = require('../models/trash');
const mongoose = require('mongoose');
const request = require('request');


var url = "https://api.thingspeak.com/channels/1396062/feeds.json?results=1"
var thingspeakData = (req, res, next) => {
    try {
        request(url, async (error, response, body) => {
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
                        console.log("addData", addData);
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
            console.log(todayTrash);
            return todayTrash;
        });
    } catch (error) {
        console.error(error.message);
    }
}


module.exports = { thingspeakData };