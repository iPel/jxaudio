/**
 * [Javascript core part]: audio 扩展
 */
 
/** 
 * @description
 * Package: jx.audio
 * 
 * Need package:
 * jx.core.js
 * 
 */
Jx().$package(function(J){
    
    var packageContext = this,
        $D = J.dom,
        $E = J.event,
        $B = J.browser;

    var BaseAudio = new J.Class({
        init : function(){ throw 'init does not implement a required interface'; },
        //load : function(){ throw 'load does not implement a required interface'; },
        play : function(){ throw 'play does not implement a required interface'; },
        pause : function(){ throw 'pause does not implement a required interface'; },
        stop : function(){ throw 'stop does not implement a required interface'; },

        getVolume : function(){  },
        setVolume : function(value){  },
        getLoop : function(){  },
        setLoop : function(){  },
        /*getAutoplay : function(){  },
        setAutoplay : function(){  },*/
        setMute : function(){  },
        getMute : function(){  },
        getPosition : function(){ throw 'getPosition does not implement a required interface'; },
        setPosition : function(){ throw 'setPosition does not implement a required interface'; },

        getBuffered : function(){  },
        getDuration : function(){ throw 'getDuration does not implement a required interface'; },
        getState : function(){  },
        free : function(){ throw 'free does not implement a required interface'; },

        on : function(){  },
        off : function(){  }
    });

    var AUDIO_MODE = {
        NONE : 0,
        NATIVE : 1,
        WMP : 2,
        FLASH : 3
    };
    /**
     * @ignore
     */
    var audioModeDetector = function(){
        return 3;
        if(window.Audio && (new Audio).canPlayType('audio/mpeg')){ //支持audio
            return AUDIO_MODE.NATIVE;
        }else if(J.browser.plugins.flash>=9){ //支持flash控件
            return AUDIO_MODE.FLASH;
        }else
        /*if(!!window.ActiveXObject && (function(){
                try{
                    new ActiveXObject("WMPlayer.OCX.7");
                }catch(e){
                    return false;
                }
                return true;
            })()){ //支持wmp控件
            return AUDIO_MODE.WMP;
        }else*/
        {
            return AUDIO_MODE.NONE; //啥都不支持
        }
    };

    var getContainer = function(mode){
        var _container;
        return function(mode){
            if(!_container){
                var node = document.createElement('div');
                node.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;margin:0;padding:0;' + (mode === AUDIO_MODE.FLASH ? 'left:0;top:0;' : 'left:-1px;top:-1px;');
                (document.body || document.documentElement).appendChild(node);
                if(mode === AUDIO_MODE.FLASH){
                    node.innerHTML = '<object id="JxAudioObject" name="JxAudioObject" ' + (J.browser.ie ? 'classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"' : 'type="application/x-shockwave-flash" data="jxaudioobject.swf"') + 'width="1" height="1" align="top">\
                        <param name="movie" value="jxaudioobject.swf" /><param name="allowScriptAccess" value="always" /><param name="allowFullScreen" value="false" /><param name="quality" value="high" /><param name="wmode" value="opaque" />\
                        </object>';
                    _container = J.dom.id('JxAudioObject') || window['JxAudioObject'] || document['JxAudioObject'];
                }else{
                    _container = node;
                }
            }
            return _container;
        }
    }();
    var getSequence = function(){
        var _seq = 0;
        return function(){
            return _seq++;
        }
    }();

    switch(audioModeDetector()){
        case AUDIO_MODE.NATIVE:
            J.Audio = new J.Class({extend:BaseAudio},{
                init : function(option){
                    option = option || {};
                    var el = this._el = new Audio();
                    el.loop = Boolean(option.loop); //default by false
                    /*el.autoplay = option.autoplay !== false; //defalut by true*/
                    getContainer(AUDIO_MODE.NATIVE).appendChild(el);
                    if(option.src){
                        // el.src = option.src;
                        this.play(option.src);
                    }
                },
                play : function(url){
                    if(url){
                        this._el.src = url;
                    }
                    if(this._el.paused){
                        this._el.play();
                    }
                },
                pause : function(){
                    this._el.pause();
                },
                stop : function(){
                    this._el.duration = Infinity;
                },

                getVolume : function(){
                    return !this._el.muted && this._el.volume || 0;
                },
                setVolume : function(value){
                    if(isFinite(value)){
                        this._el.volume = Math.max(0,Math.min(value,1));
                        this._el.muted = false;
                    }
                },
                getLoop : function(){
                    return this._el.loop;
                },
                setLoop : function(value){
                    this._el.loop = value !== false;
                },
                /*getAutoplay : function(){
                    return thie._el.autoplay;
                },
                setAutoplay : function(value){
                    this._el.autoplay = value !== false;
                },*/
                getMute : function(){
                    return this._el.muted;
                },
                setMute : function(value){
                    this._el.muted = value !== false;
                },
                getPosition : function(){
                    return this._el.currentTime;
                },
                setPosition : function(value){
                    if(!isNaN(value)){
                        this._el.currentTime = Math.max(0,value);
                    }
                },
                getBuffered : function(){
                    return this._el.buffered.length && this._el.buffered.end(0) || 0;
                },
                getDuration : function(){
                    return this._el.duration;
                },
                getState : function(){
                    return this._el.reayState;
                },
                free : function(){
                    this._el.pause();
                    this._el.parentNode.removeChild(this._el);
                    this._el = null;
                },
                on : function(event, handler){
                    this._el.addEventListener(event,handler,false);
                },
                off : function(event, handler){
                    this._el.removeEventListener(event,handler,false);
                }
            });
            break;
        case AUDIO_MODE.FLASH :
            var addToQueue = function(audioObject){
                var tryInvokeCount = 0,
                    queue = [],
                    flashReady = false;
                var tryInvoke = function(){
                    ++tryInvokeCount;
                    var container = getContainer(AUDIO_MODE.FLASH);
                    if(container.audioLoad && typeof container.audioLoad === 'function'){
                        flashReady = true;
                        for(var i=0,len=queue.length;i<len;i++){
                            queue[i]._sync();
                        }
                        queue = null;
                    }else if(tryInvokeCount < 30000){
                        setTimeout(tryInvoke, 100);
                    }
                }
                return function(audioObject){
                    if(flashReady){
                        audioObject._sync();
                        return;
                    }
                    if(-1 === J.array.indexOf(queue, audioObject)){
                        queue.push(audioObject);
                    }
                    if(tryInvokeCount === 0){
                        tryInvoke();
                    }
                }
            }();
            var registerEvent, unregisterEvent;
            (function(){
                var list = [];
                window.Jx['AudioEventDispatcher'] = function(seq, event, param){
                    var audioObject = list[seq],events;
                    audioObject && audioObject._handler && (events = audioObject._handler[event]);
                    for(var i=0,len=events && events.length;i<len;i++){
                        events[i].call(audioObject, param);
                    }
                };
                registerEvent = function(audioObject){
                    list[audioObject._seq] = audioObject;
                };
                unregisterEvent = function(audioObject){
                    list[audioObject._seq] = null;
                };
            })();
            J.Audio = new J.Class({
                init : function(option){
                    this._seq = getSequence();
                    this._volume = 1;
                    this._muted = false;
                    option = option || {};
                    this._loop = Boolean(option.loop); //default by false
                    this._paused = true;
                    var container = getContainer(AUDIO_MODE.FLASH);
                    if(option.src){
                        this.play(option.src);
                    }
                },
                play : function(url){
                    var container = getContainer(AUDIO_MODE.FLASH);
                    if(url){
                        this._src = url;
                        this._paused = false;
                        if(container.audioLoad){
                            this._sync();
                        }else{
                            addToQueue(this);
                        }
                    }else{
                        this._paused = false;
                        container.audioPlay && container.audioPlay(this._seq);
                    }
                },
                pause : function(){
                    var container = getContainer(AUDIO_MODE.FLASH);
                    this._paused = true;
                    container.audioPause && container.audioPause(this._seq);
                },
                stop : function(){
                    this._paused = true;
                    var container = getContainer(AUDIO_MODE.FLASH);
                    container.audioStop && container.audioStop(this._seq);
                },

                getVolume : function(){
                    return !this._muted && this._volume || 0;
                },
                setVolume : function(value){
                    if(isFinite(value)){
                        this._volume = Math.max(0,Math.min(value,1));
                        this._muted = false;
                        var container = getContainer(AUDIO_MODE.FLASH);
                        container.audioSetVolume && container.audioSetVolume(this._seq, this._volume);
                    }
                },
                getLoop : function(){
                    return this._loop;
                },
                setLoop : function(value){
                    this._loop = value !== false;
                    var container = getContainer(AUDIO_MODE.FLASH);
                    container.audioSetLoop && container.audioSetLoop(this._loop);
                },
                getMute : function(){
                    return this._muted;
                },
                setMute : function(value){
                    this._muted = value !== false;
                    var container = getContainer(AUDIO_MODE.FLASH);
                    container.audioSetVolume && container.audioSetVolume(this._seq, this.getVolume());
                },
                getPosition : function(){
                    var container = getContainer(AUDIO_MODE.FLASH);
                    return container.audioGetPosition && container.audioGetPosition(this._seq)/1000 || 0;
                },
                setPosition : function(value){
                    if(!isNaN(value)){
                        var container = getContainer(AUDIO_MODE.FLASH);
                        container.audioSetPosition(this._seq, Math.max(0,value)*1000);
                    }
                },

                getBuffered : function(){
                    var container = getContainer(AUDIO_MODE.FLASH);
                    return container.audioGetBuffered && container.audioGetBuffered(this._seq)/1000 || 0;
                },
                getDuration : function(){
                    var container = getContainer(AUDIO_MODE.FLASH);
                    return container.audioGetDuration && container.audioGetDuration(this._seq)/1000 || 0;
                },
                getState : function(){
                    var container = getContainer(AUDIO_MODE.FLASH);
                    return container.audioGetState && container.audioGetState(this._seq) || 0;
                },
                free : function(){
                    this._paused = true;
                    var container = getContainer(AUDIO_MODE.FLASH);
                    container.audioFree && container.audioFree(this._seq);
                },

                on : function(event, handler){
                    if(!this._handler){
                        this._handler = {};
                        registerEvent(this);
                    }
                    if(!this._handler[event] || !this._handler.length){
                        this._handler[event] = [handler];
                        var container = getContainer(AUDIO_MODE.FLASH);
                        container.audioOn && container.audioOn(this._seq, event);
                    }else{
                        if(-1 === J.array.indexOf(this._handler[event],handler)){
                            this._handler[event].push(handler);
                        }
                    }
                },
                off : function(event, handler){
                    var index;
                    if(this._handler && this._handler[event] && -1 !== (index = J.array.indexOf(this._handler[event],handler))){
                        this._handler[event].splice(index,1);
                        if(!this._handler.length){
                            var container = getContainer(AUDIO_MODE.FLASH);
                            container.audioOff && container.audioOff(this._seq, event);
                            delete this._handler[event];
                        }
                    }
                },

                _sync : function(){
                    if(this._src){
                        var container = getContainer(AUDIO_MODE.FLASH),
                            seq = this._seq;
                        container.audioLoad(seq, this._src);
                        var volume = this.getVolume();
                        if(volume != 1){
                            container.audioSetVolume(seq, volume);
                        }
                        if(this._loop){
                            container.audioSetLoop(seq, true);
                        }
                        for(var event in this._handler){
                            container.audioOn(seq, event);
                        }
                        if(!this._paused){
                            container.audioPlay(seq);
                        }
                    }
                }
            });
            break;
        default:
            break;
    }
});
