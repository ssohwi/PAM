/*!
    * Start Bootstrap - SB Admin v6.0.2 (https://startbootstrap.com/template/sb-admin)
    * Copyright 2013-2020 Start Bootstrap
    * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-sb-admin/blob/master/LICENSE)
    */
(function ($) {
    "use strict";

    // Add active state to sidbar nav links
    var path = window.location.href; // because the 'href' property of the DOM element is the absolute path
    $("#layoutSidenav_nav .sb-sidenav a.nav-link").each(function () {
        if (this.href === path) {
            $(this).addClass("active");
        }
    });

    // Toggle the side navigation
    $("#sidebarToggle").on("click", function (e) {
        e.preventDefault();
        $("body").toggleClass("sb-sidenav-toggled");
    });


    // Add active state to pagination
    $(".pagination .paginate_button a.page-link").each(function () {
        var pagenaionUrl = path.split("&")[0]
        if (this.href.split("&")[0] === pagenaionUrl) {
            $(this).parent().addClass("active");
        }
    });

    // Add active state to tab
    $("a.tab").each(function () {
        var tabUrl = path.split("tab=")[1];
        if(this.href.split("tab=")[1] === tabUrl){
            $(this).addClass("active");
        }
    });

    $('.monthlyRow').on('click', function () {
        $('.dayOfMonthRow').remove();
        var userId = path.split("=")[1];
        var date = $(this).children('th').text();
        var year = date.split('-')[0];
        var month = date.split('-')[1];
        var monthlyRow = $(this);
        // Ajax GET Method
        $.ajax({
            url: '/send_data',
            dataType: 'text',
            type: 'post',
            data: {userId: userId, month: month, year: year},
        }).done(function (result) {
            if (result) {
                var dayOfMonthTrash = JSON.parse(result).dayOfMonthTrash;
                dayOfMonthTrash.forEach(function (data) {
                    var tr = $("<tr class='dayOfMonthRow'>" +
                        "<th>" + data._id.year + "-" + data._id.month + "-" + data._id.day + "</th>" +
                        "<td>" + data.can + "</td>" +
                        "<td>" + data.plastic + "</td>" +
                        "<td>" + data.glass + "</td>" +
                        "<td>" + data.total + "</td>" +
                        "</tr>");
                    monthlyRow.after(tr);
                });
            }
        }).fail(function () {
            alert("Ajax failed");
        })
    });


    $('#sortTotal').on('click', function () {
        var sort = $(this).val();
        var sortTotal = $(this);
        // Ajax GET Method
        $.ajax({
            url: '/sort_data',
            dataType: 'text',
            type: 'post',
            data: {col: "total", sort: sort},
        }).done(function (result) {
            if (result) {
                sortTotal.val(sort * (-1));
                var trashData = JSON.parse(result).trashData;
                $('#trashDatas').empty();
                trashData.forEach(function (item, index) {
                    var tr = $("<tr onclick=\"location.href='/detail?id=" + item._id + "'\" class=\"btn-light\"><th scope=\"row\">" +
                        (index+1) + "</th><td>" + item.email + "</td>" +
                        "<td>" + item.total + "</td>" +
                        "<td>" + item.can + "</td>" +
                        "<td>" + item.plastic + "</td>" +
                        "<td>" + item.glass + "</td>" +
                        "<td>" + item.super + "</td>" +
                        "</tr>");
                    $('#trashDatas').append(tr);
                });
            }
        }).fail(function () {
            alert("Ajax failed");
        })
    });

    $('#sortCan').on('click', function () {
        var sort = $(this).val();
        var sortCan = $(this);
        // Ajax GET Method
        $.ajax({
            url: '/sort_data',
            dataType: 'text',
            type: 'post',
            data: {col: "can", sort: sort},
        }).done(function (result) {
            if (result) {
                sortCan.val(sort * (-1));
                var trashData = JSON.parse(result).trashData;
                $('#trashDatas').empty();
                trashData.forEach(function (item, index) {
                    var tr = $("<tr onclick=\"location.href='/detail?id=" + item._id + "'\" class=\"btn-light\"><th scope=\"row\">" +
                        (index+1) + "</th><td>" + item.email + "</td>" +
                        "<td>" + item.total + "</td>" +
                        "<td>" + item.can + "</td>" +
                        "<td>" + item.plastic + "</td>" +
                        "<td>" + item.glass + "</td>" +
                        "<td>" + item.super + "</td>" +
                        "</tr>");
                    $('#trashDatas').append(tr);
                });
            }
        }).fail(function () {
            alert("Ajax failed");
        })
    });

    $('#sortPlastic').on('click', function () {
        var sort = $(this).val();
        var sortPlastic = $(this);
        // Ajax GET Method
        $.ajax({
            url: '/sort_data',
            dataType: 'text',
            type: 'post',
            data: {col: "plastic", sort: sort},
        }).done(function (result) {
            if (result) {
                sortPlastic.val(sort * (-1));
                var trashData = JSON.parse(result).trashData;
                $('#trashDatas').empty();
                trashData.forEach(function (item, index) {
                    var tr = $("<tr onclick=\"location.href='/detail?id=" + item._id + "'\" class=\"btn-light\"><th scope=\"row\">" +
                        (index+1) + "</th><td>" + item.email + "</td>" +
                        "<td>" + item.total + "</td>" +
                        "<td>" + item.can + "</td>" +
                        "<td>" + item.plastic + "</td>" +
                        "<td>" + item.glass + "</td>" +
                        "<td>" + item.super + "</td>" +
                        "</tr>");
                    $('#trashDatas').append(tr);
                });
            }
        }).fail(function () {
            alert("Ajax failed");
        })
    });

    $('#sortGlass').on('click', function () {
        var sort = $(this).val();
        var sortGlass = $(this);
        // Ajax GET Method
        $.ajax({
            url: '/sort_data',
            dataType: 'text',
            type: 'post',
            data: {col: "glass", sort: sort},
        }).done(function (result) {
            if (result) {
                sortGlass.val(sort * (-1));
                var trashData = JSON.parse(result).trashData;
                $('#trashDatas').empty();
                trashData.forEach(function (item, index) {
                    var tr = $("<tr onclick=\"location.href='/detail?id=" + item._id + "'\" class=\"btn-light\"><th scope=\"row\">" +
                        (index+1) + "</th><td>" + item.email + "</td>" +
                        "<td>" + item.total + "</td>" +
                        "<td>" + item.can + "</td>" +
                        "<td>" + item.plastic + "</td>" +
                        "<td>" + item.glass + "</td>" +
                        "<td>" + item.super + "</td>" +
                        "</tr>");
                    $('#trashDatas').append(tr);
                });
            }
        }).fail(function () {
            alert("Ajax failed");
        })
    });

})(jQuery);