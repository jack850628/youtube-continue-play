// ==UserScript==
// @name               youtube continue play
// @name:zh-CN         youtube继续播放
// @name:zh-TW         youtube繼續播放
// @name:ja            youtube再生自動継続
// @description        When "Video paused, do you want to continue watching?" Appears, ignore it and continue playing automatically
// @description:zh-TW  當出現"影片已暫停，要繼續觀賞嗎？"時忽略它繼續播放
// @description:zh-CN  当出现"影片已暂停，要继续观赏吗？"时忽略它继续播放
// @description:ja    「動画が一時停止されました。続きを視聴しますか？」が表示されても無視して再生を続けます
// @namespace          https://greasyfork.org/zh-TW/users/461233-jack850628
// @version            1.20.0519
// @author             jack850628
// @include            /^https?:\/\/(:?.*?\.)*youtube.com\/.*$/
// @noframes
// @run-at             document-end
// @license            MIT
// ==/UserScript==
 
(function() {
    let pausedFun = function({target: videoPlayer}){
        console.debug('暫停播放');
        setTimeout(function(){
            let ytConfirmDialog = document.querySelector('yt-confirm-dialog-renderer') || document.querySelector('dialog');
            if(
                ytConfirmDialog &&
                (
                    ytConfirmDialog.parentElement.style.display != 'none' ||
                    (
                        document.hidden &&
                        videoPlayer.currentTime < videoPlayer.duration//防止重複播放
                    )//當網頁不可見時，DOM元件不會即時渲染，所以對話方塊的display還會是none
                )
            ){
                console.debug('被暫停了，但是我要繼續播放');
                //ytConfirmDialog.querySelector('yt-button-renderer[dialog-confirm]').click();//當網頁不可見時，觸發click是不會繼續播放的，因為要等到網頁可見時觸發UI渲染後才會把對話方塊關掉，對話方塊關掉後才會出發video的play事件
                videoPlayer.play();
                console.debug('按下"是"');
            }else console.debug('對話方塊找不到或是隱藏了', ytConfirmDialog && ytConfirmDialog.parentElement, document.hidden, videoPlayer.currentTime, videoPlayer.duration);
        }, 500);//確保在暫停時對話方塊一定找得到
    }
    let listenerVideoPlayer = function(doc){
        let pathname = new URL(location.href).pathname;
        let videoPlayer = doc.querySelector('video');
 
        console.debug(pathname, pathname.startsWith('/watch'))
        if(!videoPlayer || !pathname.startsWith('/watch')){
            console.debug('找不到播放器');
            return false;
        }
        videoPlayer.addEventListener('pause', pausedFun);
        console.debug('找到播放器，開始監聽', videoPlayer);
        return true;
    }
    let ycpObserver = new MutationObserver(([{target: doc}], observer) => {
        console.debug('頁面更動', ycpObserver);
        if(listenerVideoPlayer(doc)) ycpObserver.disconnect();
    });
    ycpObserver.observe(
        document,
        {
            childList: true,
            subtree: true
        }
    );
})();
