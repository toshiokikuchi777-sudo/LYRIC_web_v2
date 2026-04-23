'use strict';

//スライダー卵型
//スライダー卵型 (リッチデザイン化)
$(document).ready(function () {
  $(".slider").slick({
    autoplay: true, //自動スライド
    autoplaySpeed: 3000, //スライドの再生速度
    speed: 800, //スライド切り替え速度
    dots: true, //ドットインジケーター表示
    arrows: false, //左右矢印は非表示（デザインによる）
    centerMode: true, //センターモード有効化
    centerPadding: '15%', //PC: 余白を減らして中央表示領域を約70%まで拡大
    slidesToShow: 1, //PCでも1枚をメインにする
    pauseOnFocus: false,
    pauseOnHover: false,
    pauseOnDotsHover: false,
    responsive: [
      {
        breakpoint: 768, //スマホ・タブレット
        settings: {
          slidesToShow: 1,
          centerMode: true,
          centerPadding: '40px', //スマホ調整
        }
      }
    ]
  });
});

// スクロールアニメーション (Intersection Observer)
document.addEventListener("DOMContentLoaded", function () {
  // IntersectionObserver設定
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -8% 0px',
    threshold: 0.12 // 少し見えたら発火（軽快に）
  };

  // prefers-reduced-motion 尊重
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 旧: .fade-in-up → add('visible')（後方互換）
  // 新: [data-reveal] → add('is-revealed')（最高版デザイン用）
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.classList.contains('fade-in-up')) {
        el.classList.add('visible');
      }
      if (el.hasAttribute('data-reveal')) {
        el.classList.add('is-revealed');
      }
      obs.unobserve(el);
    });
  }, observerOptions);

  // 監視対象：.fade-in-up と [data-reveal]
  const legacyTargets = document.querySelectorAll('.fade-in-up');
  const revealTargets = document.querySelectorAll('[data-reveal]');

  if (prefersReduced) {
    // モーション抑制時は即座に表示状態へ
    legacyTargets.forEach(t => t.classList.add('visible'));
    revealTargets.forEach(t => t.classList.add('is-revealed'));
  } else {
    legacyTargets.forEach(t => observer.observe(t));
    // data-reveal は出現順に小さなディレイを付与（data-reveal-delay が無い場合）
    revealTargets.forEach((t, i) => {
      if (!t.hasAttribute('data-reveal-delay')) {
        t.setAttribute('data-reveal-delay', String((i % 4) + 1));
      }
      observer.observe(t);
    });
  }
});

//ページトップボタン
$(function () {
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

//ページ内リンクメニューをクリックした後ブラウザバックしてもメニューを開かなくする
$(function () {
  $('.page_link a').on('click', function () {
    $('#input').prop('checked', false);
  });
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

//HBメニュー閉じたあとスクロールを元に戻す関数
function closeNavi() {
  bodyFixReset(); // body固定を解除する関数

}

//メニュー表示時bodyを固定する関数
function bodyFix() {
  const scrollPosi = $(window).scrollTop();
  $('body').css({
    'position': 'fixed',
    'width': '100%',
    'z-index': '1',
    'top': -scrollPosi,
  });
};


//メニュー閉じた後body固定を解除する関数
function bodyFixReset() {
  const scrollPosi = $('body').offset().top;
  $('body').css({
    'position': 'absolute',
    'width': '100%',
    'top': 'scrollPosi',
  });
  //scroll位置を調整
  $('html, body').scrollTop(-scrollPosi);
};
//---------------------------------------------------------
// DOM Ready
$(function () {

  // モーダルの設定（自動オープンの前に初期化が必要）
  $(".video-open").modaal({
    type: 'iframe', // 自動解析ではなくiframeとして直接表示
    width: 800,     // iframeの幅
    height: 450,    // iframeの高さ
    background: '#f3f3e3',
    overlay_close: true,
    loading_content: 'Loading video...',
    before_open: function () {
      $('html').css('overflow-y', 'hidden');
      $('#floatingVideoBtn').fadeOut();
    },
    after_close: function () {
      $('html').css('overflow-y', 'scroll');
      $('#floatingVideoBtn').css('display', 'flex').hide().fadeIn();
    },
    error: function (e) {
      console.error("Modaal Error:", e);
    }
  });

  // フローティングボタンクリックでモーダルを開く
  $('#floatingVideoBtn').on('click', function () {
    $('.video-open').modaal('open');
  });

  // 自動オープン：DOM準備完了から1.5秒後に開く（Load待ちはしない）
  /*
  setTimeout(function () {
    console.log("Auto opening video modal...");
    $('.video-open').modaal('open');
  }, 1500);
  */

  // モーダル自動オープンを無効にしたため、ボタンを初期表示する
  setTimeout(function () {
    $('#floatingVideoBtn').css('display', 'flex').hide().fadeIn();
  }, 1000);

});

// ページが完全に閉じられる前にセッションストレージをクリア（念のため残す）
window.addEventListener('beforeunload', function () {
  sessionStorage.removeItem("modalShown");
});

// NEWS表示制御：最新5件を表示、それ以外は「もっと見る」で展開
document.addEventListener("DOMContentLoaded", function () {
  const newsList = document.querySelector('.news-list');
  if (!newsList) return;

  const items = Array.from(newsList.querySelectorAll('.news_item'));
  const VISIBLE_COUNT = 5;

  // datetime降順でソート
  items.sort(function (a, b) {
    const da = new Date(a.querySelector('time')?.getAttribute('datetime') || 0);
    const db = new Date(b.querySelector('time')?.getAttribute('datetime') || 0);
    return db - da;
  });

  items.forEach(function (item, index) {
    newsList.appendChild(item);
    if (index >= VISIBLE_COUNT) {
      item.classList.add('news_item--hidden');
      item.style.display = 'none';
    }
  });

  // もっと見るボタン追加
  if (items.length > VISIBLE_COUNT) {
    const moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'news-more-btn';
    moreBtn.textContent = 'もっと見る';
    moreBtn.setAttribute('aria-expanded', 'false');
    newsList.parentNode.insertBefore(moreBtn, newsList.nextSibling);

    moreBtn.addEventListener('click', function () {
      const expanded = moreBtn.getAttribute('aria-expanded') === 'true';
      items.forEach(function (item, index) {
        if (index >= VISIBLE_COUNT) {
          item.style.display = expanded ? 'none' : '';
        }
      });
      moreBtn.setAttribute('aria-expanded', String(!expanded));
      moreBtn.textContent = expanded ? 'もっと見る' : '閉じる';
    });
  }
});