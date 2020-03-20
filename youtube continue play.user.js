// ==UserScript==
// @name               youtube continue play
// @name:en            youtube continue play
// @name:zh-CN         youtube继续播放
// @name:zh-TW         youtube繼續播放
// @name:ja            youtube履歴書再生
// @description        When "Video paused, do you want to continue watching?" Appears, ignore it and continue playing automatically
// @description:en     When "Video paused, do you want to continue watching?" Appears, ignore it and continue playing automatically
// @description:zh-TW  當出現"影片已暫停，要繼續觀賞嗎？"時忽略它繼續播放
// @description:zh-CN  当出现"影片已暂停，要继续观赏吗？"时忽略它继续播放
// @description:ja    「ビデオが一時停止しましたが、引き続き視聴しますか？」が表示されたら無視して再生を続けます
// @namespace          https://greasyfork.org/zh-TW/users/461233-jack850628
// @version            1.16
// @author             jack850628
// @include            /^https?:\/\/(:?.*?\.)*youtube.com\/.*$/
// @noframes
// @run-at             document-end
// @license            MIT
// ==/UserScript==

(function() {
        let pausedF = function({target: videoPlay}){
        console.debug('暫停播放');
        setTimeout(function(){
            let ytConfirmDialog = document.querySelector('yt-confirm-dialog-renderer');
            if(
                ytConfirmDialog &&
                (
                    ytConfirmDialog.parentElement.style.display != 'none' ||
                    (
                        document.hidden &&
                        videoPlay.getCurrentTime() < videoPlay.getDuration()//防止重複播放
                    )//當網頁不可見時，DOM元件不會即時渲染，所以對話方塊的display還會是none
                )
            ){
                console.debug('被暫停了，但是我要繼續播放');
                //ytConfirmDialog.querySelector('yt-button-renderer[dialog-confirm]').click();//當網頁不可見時，出發click是不會繼續播放的，因為要等到網頁可見時觸發UI渲染後才會把對話方塊關掉，對話方塊關掉後才會出發video的play事件
                videoPlay.play();
                console.debug('按下"是"');
            }else console.debug('對話方塊找不到或是隱藏了',ytConfirmDialog);
        }, 500);//確保在暫停時對話方塊一定找得到
    }
    function listenerVideoPlayer(){
        let videoPlay = document.querySelector('video');
        if(!videoPlay){
            console.debug('找不到播放器');
            return false;
        }
        videoPlay.addEventListener('pause', pausedF);
        console.debug('找到播放器，開始監聽');
        return true;
    }
    let scriptBlocks = document.getElementsByTagName('script')[0];
	let ycpScript = document.createElement('script');
    ycpScript.setAttribute('id','ycp-script');
    ycpScript.setAttribute('ycp-data','wait');
	ycpScript.innerHTML = `
		window.spf._request = window.spf.request;//youtube的ajax是使用spf，https://github.com/youtube/spfjs
		Object.defineProperty(window.spf, 'request', {//改寫request函數
			value: function(){
				if(arguments[1]){
					if(arguments[1].onDone){//當請求完成後嘗試監聽VideoPlayer
						let onDone = arguments[1].onDone;
						arguments[1].onDone = function(){
							let result = onDone.apply(this,arguments);
							document.querySelector('#ycp-script').setAttribute('ycp-data','ok');
							return result;
						}
					}else{
						arguments[1].onDone = () => document.querySelector('#ycp-script').setAttribute('ycp-data','ok');
					}
				}
				return window.spf._request.apply(this,arguments);
			},
			writable: true,
			configurable: true
		});
        document.querySelector('#ycp-script').setAttribute('ycp-data','ok');
	`;
    let ycpScriptObserver = new MutationObserver(([{target: ycpScript}], observer) => {
        console.debug('#ycp-script屬性更動', ycpScript, ycpScriptObserver);
        if(ycpScript.getAttribute('ycp-data') == 'ok'){
            if(!listenerVideoPlayer()) ycpScript.setAttribute('ycp-data','wait')
            else ycpScriptObserver.disconnect();
        }
    });
	if(scriptBlocks){
        ycpScriptObserver.observe(
            ycpScript,
            {
                attributes: true
            }
        );
		scriptBlocks.parentNode.insertBefore(ycpScript,scriptBlocks);
	}
})();
