// ==UserScript==
// @name               youtube continue play
// @name:en            youtube continue play
// @name:zh-CN         youtube继续播放
// @name:zh-TW         youtube繼續播放
// @name:ja            youtube履歴書再生
// @description        When the "Video paused, do you want to continue watching?" Dialog box appears, press "Yes" automatically
// @description:en     When the "Video paused, do you want to continue watching?" Dialog box appears, press "Yes" automatically
// @description:zh-TW  當出現"影片已暫停，要繼續觀賞嗎？"對話方塊時自動按下"是"
// @description:zh-CN  当出现"影片已暂停，要继续观赏吗？"对话方块时自动按下"是"
// @description:ja    「ビデオを一時停止しました。引き続き視聴しますか？」ダイアログボックスが表示されたら、「はい」を自動的に押します
// @namespace          https://greasyfork.org/zh-TW/users/461233-jack850628
// @version            1.12
// @author             jack850628
// @include            /^https?:\/\/(:?.*?\.?)youtube.com/.*$/
// @run-at             document-end
// @license            MIT
// ==/UserScript==

(function() {
    const debug = true;
    var isObserveYtConfirmDialogRenderer = false;
    let ytConfirmDialogRendererObserver = new MutationObserver(([{target: ytConfirmDialogRenderer}], observer) => {
        if(ytConfirmDialogRenderer.style.display != 'none'){
            if(debug) console.log('被暫停了，但是我要繼續播放');
            ytConfirmDialogRenderer.querySelector('yt-button-renderer[dialog-confirm]').click();
            if(debug) console.log('按下"是"');
        }
    });
    let pausedF = function({target: videoPlay}){
        if(debug) console.log('暫停播放');
        if(!isObserveYtConfirmDialogRenderer){
            setTimeout(function(){
                let ytConfirmDialog = document.querySelector('yt-confirm-dialog-renderer');
                if(ytConfirmDialog){
                    ytConfirmDialogRendererObserver.observe(
                        ytConfirmDialog.parentElement,
                        {
                            attributes: true
                        }
                    );
                    isObserveYtConfirmDialogRenderer = true;
                }else if(debug) console.log('對話方塊找不到',ytConfirmDialog);
            }, 500);//確保在暫停時對話方塊一定找得到
        }else if(debug) console.log('對話方塊已經被觀察了');
    }
    function listenerVideoPlayer(){
        let videoPlay = document.querySelector('video');
        if(!videoPlay){
            if(debug) console.log('找不到播放器');
            return false;
        }
        videoPlay.addEventListener('pause', pausedF);
        if(debug) console.log('找到播放器，開始監聽');
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
        if(debug) console.log('#ycp-script屬性更動', ycpScript, ycpScriptObserver);
          if(ycpScript.getAttribute('ycp-data') == 'ok'){
              if(!listenerVideoPlayer()) ycpScript.setAttribute('ycp-data','wait')
              else{
                  ycpScriptObserver.disconnect();
              }
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
