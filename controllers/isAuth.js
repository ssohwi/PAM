exports.isLoggedIn = (req, res, next) => {
    if (req.session.is_logined) {
        next();
    } else {
        res.send('<script> alert("로그인이 필요합니다."); window.location="/login"; </script>')
    }
};

exports.isNotLoggedIn = (req, res, next) => {
    if (!req.session.is_logined) {
        next();
    } else {
        res.send('<script> alert("이미 로그인 한 상태입니다."); window.location="/"; </script>');
    }
};

exports.isAdmin = (req, res, next) => {
    if (req.session.is_admin) {
        next();
    } else {
        res.send('<script> alert("관리자 권한이 필요합니다."); window.location="/"; </script>')
    }
};