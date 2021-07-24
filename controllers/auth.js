const Account = require('../models/account');
const mongoose = require('mongoose');
const crypto = require("crypto");

// 회원가입
const signUp = async (req, res) => {
    try {
        // POST 메소드 요청의 데이터(body)를 destructuring
        const { email, password, passwordCheck, name } = req.body;
        // email 중복 확인
        let user = await Account.findOne({ email });
        if (user) {
            res.send('<script> alert("이미존재하는 이메일입니다."); window.location="/signup"; </script>')
        }
        // 암호 일치 확인
        else if (password !== passwordCheck) {
            res.send('<script> alert("비밀번호가 일치하지 않습니다."); window.location="/signup"; </script>')
        }
        // 객체화 후 저장
        else {
            const user = new Account({
                _id: new mongoose.Types.ObjectId(),
                name: req.body.name,
                email: req.body.email,
                password: crypto.createHash('sha512').update(req.body.password).digest('base64')
            });
            await user.save();
            res.redirect("/");
        }
    } catch (error) {
        console.error(error.message);
    }
};

// 로그인
const login = async (req, res) => {
    try {
        // POST 메소드 요청의 데이터(body)를 destructuring
        const { email, password } = req.body;
        // input 으로 들어오지 않은 경우
        if (!email || !password) {
            res.send('<script> alert("잘못된 입력입니다."); window.location="/login"; </script>')
        }
        // email 조회
        const user = await Account.findOne({ email });
        // email 존재하지 않은 경우
        if (!user) {
            res.send('<script> alert("사용자를 찾을 수 없습니다."); window.location="/login"; </script>')
        }
        // password 비교
        else {
            // password 일치하지 않는 경우
            if (user.password !== crypto.createHash('sha512').update(password).digest('base64')) {
                res.send('<script> alert("비밀번호가 일치하지 않습니다."); window.location="/login"; </script>')
            }
            else {
                req.session.is_logined = true;
                req.session.is_admin = user.super;
                req.session._id = user._id;
                req.session.name = user.name;
                req.session.save(function () {
                    res.redirect(`/`);
                });
            }
        }
    } catch (error) {
        console.error(error.message);
    }
};

// 회원 수정
const profile = (req, res) => {
    try {
        const { email, password, passwordCheck, name } = req.body;
        if (password !== passwordCheck) {
            res.send('<script> alert("비밀번호가 일치하지 않습니다."); window.location="/profile"; </script>');
        }
        else {
            Account.findByIdAndUpdate(req.session._id, { $set: { name: name, email: email, password: password } },
                function () {
                    res.send('<script> alert("회원 정보가 변경되었습니다."); window.location="/profile"; </script>');
                });
        }
    }
    catch (error) {
        console.log(error);
        next(error);
    }
};

// 회원 탈퇴
const deleteUser = async (req, res, next) => {
    try {
        const user = await Account.findByIdAndDelete(req.session._id);
        if (!user) {
            res.status(400).send('id not searched');
        }
        else {
            req.session.destroy((err) => {
                if (err) {
                    res.status(400).send('<script>alert("you are currently not logined");location.href="/";</script>');
                } else {
                    res.status(200).send('<script>alert("안전하게 탈퇴처리되었습니다.");location.href="/";</script>');
                }
            });
        }
    }
    catch (error) {
        console.log(error);
        next(error);
    }
};


module.exports = { signUp, login, deleteUser, profile };