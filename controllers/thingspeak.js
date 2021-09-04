const Trash = require('../models/trash');
const mongoose = require('mongoose');
const request = require('request');


// results 값 1로 변경해야함
var url = "https://api.thingspeak.com/channels/1396062/feeds.json?results=5"
var thingspeakData = (req, res, next) => {
    try {
        request(url, async (error, response, body) => {
            // feeds 뒤에 배열 지우기
            var data = JSON.parse(body).feeds[3];

            var entryId = data.entry_id;
            if (true) {
                var createdAt = data.created_at;
                var canCnt = data.field1;
                var glassCnt = data.field2;
                var plasticCnt = data.field3;
                var totalCnt = data.field4;

                const trash = new Trash({
                    _id: new mongoose.Types.ObjectId(),
                    entryId: entryId,
                    can: canCnt,
                    glass: glassCnt,
                    plastic: plasticCnt,
                    total: totalCnt,
                    createdAt: createdAt,
                });
                await trash.save();
                res.redirect("/");
            }
        });
    } catch (error) {
        console.error(error.message);
    }
}

module.exports = { thingspeakData };