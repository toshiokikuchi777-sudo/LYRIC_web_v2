'use strict';
//スライダー卵型
$(document).ready(function () {
  $(".slider").slick({
    autoplay: true,//自動スライド
    autoplaySpeed: 2000,//スライドの再生速度
    fade: true,//フェードのオンオフ
    speed: 900,//フェード速度
    arrows: false,//左右矢印の表示
    pauseOnFocus: false,//フォーカスで一時停止
    pauseOnHover: false,//マウスホバーで一時停止
    pauseOnDotsHover: false//ドットナビをマウスホバーで一時停止
  });
});

//ページトップボタン
$(function () {

  //TOPページボタン
  $('.page-top').hide(); //TOPページトップボタン非表示

  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) { //スクロールが100より大きい場合
      $('.page-top').fadeIn();//フェードイン
    } else {
      $('.page-top').fadeOut();//フェードアウト
    }
  });

  $('.page-top').click(function () {
    $('body,html').animate({ scrollTop: 0 }, 500); //TOPへスクロール
    return false;
  });
});

//ページ内リンクメニュー閉じる
$(function () {
  $('.page_link a').on('click', function () {
    $('#input').prop('checked', false);
  });
});


//youtube_slider
$('.youtube_container').slick({
  autoplay: true,
  autoplaySpeed: 4000,
  centerMode: true,
  centerPadding: '10%',
  // dots: true,
  arrows: true,
  pauseOnFocus: true,
  pauseOnHover: true,
  pauseOnDotsHover: true
});

//HBメニュー内body固定
$(function () {
  let flag = false;
  $('#nav_open').on('click', function () {
    if (flag == false) {
      bodyFix(); // bodyを固定させる関数

      // その他、ナビを開くときに起きるあれこれを記述

      flag = true;
    } else {
      closeNavi();
      flag = false;
    }
  });
});

//ナビを閉じるときの関数
function closeNavi() {
  bodyFixReset(); // body固定を解除する関数

  // その他、ナビを閉じるときに起きるあれこれを記述

}

//以下、bodyを固定する関数
function bodyFix() {
  const scrollPosi = $(window).scrollTop();
  $('body').css({
    'position': 'fixed',
    'width': '100%',
    'z-index': '1',
    'top': -scrollPosi,
  });
};


//以下、body固定を解除する関数
function bodyFixReset() {
  const scrollPosi = $('body').offset().top;
  $('body').css({
    'position': 'absolute',
    'width': '100%',
    'top': 'auto',
  });
  //scroll位置を調整
  $('html, body').scrollTop(-scrollPosi);
};



