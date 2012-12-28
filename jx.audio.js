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
        return 2;
        if(window.Audio && (new Audio).canPlayType('audio/mpeg')){ //支持audio
            return AUDIO_MODE.NATIVE;
        }else if(!!window.ActiveXObject && (function(){
                try{
                    new ActiveXObject("WMPlayer.OCX.7");
                }catch(e){
                    return false;
                }
                return true;
            })()){ //支持wmp控件
            return AUDIO_MODE.WMP;
        }else if(J.browser.plugins.flash>=9){ //支持flash控件
            return AUDIO_MODE.FLASH;
        }else{
            return AUDIO_MODE.NONE; //啥都不支持
        }
    };

    var getContainer = function(){
        var _container;
        return function(mode){
            if(!_container){
                var node = document.createElement('div');
                node.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;margin:0;padding:0;left:0;top:0;';
                (document.body || document.documentElement).appendChild(node);
                if(mode == AUDIO_MODE.FLASH){
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
                free : function(){
                    this._el.pause();
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
                    var container = getContainer();
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
                    var container = getContainer();
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
                    var container = getContainer();
                    this._paused = true;
                    container.audioPause && container.audioPause(this._seq);
                },
                stop : function(){
                    this._paused = true;
                    var container = getContainer();
                    container.audioStop && container.audioStop(this._seq);
                },

                getVolume : function(){
                    return !this._muted && this._volume || 0;
                },
                setVolume : function(value){
                    if(isFinite(value)){
                        this._volume = Math.max(0,Math.min(value,1));
                        this._muted = false;
                        var container = getContainer();
                        container.audioSetVolume && container.audioSetVolume(this._seq, this._volume);
                    }
                },
                getLoop : function(){
                    return this._loop;
                },
                setLoop : function(value){
                    this._loop = value !== false;
                    var container = getContainer();
                    container.audioSetLoop && container.audioSetLoop(this._loop);
                },
                getMute : function(){
                    return this._muted;
                },
                setMute : function(value){
                    this._muted = value !== false;
                    var container = getContainer();
                    container.audioSetVolume && container.audioSetVolume(this._seq, this.getVolume());
                },
                getPosition : function(){
                    var container = getContainer();
                    return container.audioGetPosition && container.audioGetPosition(this._seq)/1000 || 0;
                },
                setPosition : function(value){
                    if(!isNaN(value)){
                        var container = getContainer();
                        container.audioSetPosition(this._seq, Math.max(0,value)*1000);
                    }
                },

                getBuffered : function(){
                    var container = getContainer();
                    return container.audioGetBuffered && container.audioGetBuffered(this._seq)/1000 || 0;
                },
                getDuration : function(){
                    var container = getContainer();
                    return container.audioGetDuration && container.audioGetDuration(this._seq)/1000 || 0;
                },
                free : function(){
                    this._paused = true;
                    var container = getContainer();
                    container.audioFree && container.audioFree(this._seq);
                },

                on : function(event, handler){
                    if(!this._handler){
                        this._handler = {};
                        registerEvent(this);
                    }
                    if(!this._handler[event] || !this._handler[event].length){
                        this._handler[event] = [handler];
                        var container = getContainer();
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
                        if(!this._handler[event].length){
                            var container = getContainer();
                            container.audioOff && container.audioOff(this._seq, event);
                            delete this._handler[event];
                        }
                    }
                },

                _sync : function(){
                    if(this._src){
                        var container = getContainer(),
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
        case AUDIO_MODE.WMP:
            J.Audio = new J.Class({extend:BaseAudio},{
                init : function(option){
                    this._seq = getSequence();
                    option = option || {};
                    var wrap = document.createElement('div');
                    getContainer(AUDIO_MODE.WMP).appendChild(wrap);
                    wrap.innerHTML = '<object id="WMPObject'+this._seq+'" classid="CLSID:6BF52A52-394A-11D3-B153-00C04F79FAA6" standby="" type="application/x-oleobject" width="0" height="0">\
                        <param name="AutoStart" value="true"><param name="ShowControls" value="0"><param name="uiMode" value="none"></object>';
                    var el = this._el = J.dom.id('WMPObject'+this._seq) || window['WMPObject'+this._seq];
                    this._loop = Boolean(option.loop); //default by false
                    /*el.autoplay = option.autoplay !== false; //defalut by true*/
                    if(option.src){
                        // el.src = option.src;
                        this.play(option.src);
                    }
                },
                play : function(url){
                    if(url){
                        var a = document.createElement('a');
                        a.href = url;
                        url = J.dom.getHref(a);
                        this._el.URL = J.dom.getHref(a);
                    }
                    if(this._el.playState === 2){ //paused
                        this._el.controls.play();
                    }
                },
                pause : function(){
                    this._el.controls.pause();
                },
                stop : function(){
                    this._el.controls.stop();
                },

                getVolume : function(){
                    return !this._el.settings.mute && this._el.settings.volume / 100 || 0;
                },
                setVolume : function(value){
                    if(isFinite(value)){
                        this._el.settings.volume = Math.max(0,Math.min(value,1)) * 100;
                        this._el.settings.mute = false;
                        this._fire('volumechange');
                    }
                },
                getLoop : function(){
                    return this._loop;
                },
                setLoop : function(value){
                    this._loop = value !== false;
                },
                getMute : function(){
                    return this._el.settings.mute;
                },
                setMute : function(value){
                    this._el.settings.mute = value !== false;
                    this._fire('volumechange');
                },
                getPosition : function(){
                    return this._el.controls.currentPosition;
                },
                setPosition : function(value){
                    if(!isNaN(value)){
                        this._el.controls.currentPosition = Math.max(0,value);
                    }
                },
                getBuffered : function(){
                    return this._el.network.downloadProgress * .01 * this.getDuration();
                },
                getDuration : function(){
                    return this._el.currentMedia.duration;
                },
                free : function(){
                    this._el.controls.stop();
                    this._el = null;
                },

                on : function(event, handler){
                    if(!this._handler){
                        this._handler = {};
                    }
                    switch(event){
                        case 'timeupdate':
                            this._el.attachEvent('PositionChange', handler);
                            if(!(this._handler[event] || (this._handler[event] = [])).length){

                            }
                            this._handler[event].push(handler);
                            this._startPoll();
                            break;
                        case 'waiting':
                        case 'playing':
                            if(!(this._handler['waiting'] || (this._handler['waiting'] = [])).length &&
                                !(this._handler['playing'] || (this._handler['playing'] = [])).length){
                                var context = this;
                                this._onBuffering = function(isStart){
                                    if(!(context._el.currentMedia || 0).sourceURL){
                                        return;
                                    }
                                    if(isStart){
                                        context._fire('waiting');
                                    }else{
                                        context._fire('playing');
                                    }
                                };
                                this._el.attachEvent('Buffering', this._onBuffering);
                            }
                            this._handler[event].push(handler);
                            break;
                        case 'error':
                            this._el.attachEvent('MediaError',handler);
                            break;
                        case 'progress':
                        case 'ended':
                        case 'canplay':
                            if(!(this._handler['progress'] || (this._handler['progress'] = [])).length &&
                                !(this._handler['ended'] || (this._handler['ended'] = [])).length &&
                                !(this._handler['canplay'] || (this._handler['canplay'] = [])).length){
                                var context = this;
                                this._onPlayStateChange = function(state){
                                    if(!(context._el.currentMedia || 0).sourceURL){
                                        return;
                                    }
                                    console.log('playstate:',state);
                                    if(state === 6){ //Buffering
                                        context._fire('progress');
                                    }else if(state === 10){ //Ready
                                        context._fire('canplay');
                                    }else if(state === 8 || state === 1){ //MediaEnded, Stopped
                                        context._fire('ended');
                                    }
                                }
                                this._el.attachEvent('PlayStateChange', this._onPlayStateChange);
                            }
                            this._handler[event].push(handler);
                            break;
                        case 'loadstart':
                        case 'loadeddata':
                            if(!(this._handler['loadstart'] || (this._handler['loadstart'] = [])).length &&
                                !(this._handler['loadeddata'] || (this._handler['loadeddata'] = [])).length){
                                var context = this;
                                this._onOpenStateChange = function(state){
                                    if(!(context._el.currentMedia || 0).sourceURL){
                                        return;
                                    }
                                    console.log('openstate:',state);
                                    if(state === 10){
                                        context._fire('loadstart');
                                    }else if(state === 12){
                                        context._fire('loadeddata');
                                    }
                                }
                                this._el.attachEvent('OpenStateChange', this._onOpenStateChange);
                            }
                            this._handler[event].push(handler);
                            break;
                        default:
                            break;
                    }
/*
        CANPLAYTHROUGH : 'canplaythrough',
        DURATIONCHANGE : 'durationchange',

        PAUSE : 'pause',
        PLAY : 'play',
        SEEKED : 'seeked',
        SEEKING : 'seeking',
        */

                },
                off : function(event, handler){
                    if(!this._handler){
                        return;
                    }
                    var index;
                    if(this._handler && this._handler[event] && -1 !== (index = J.array.indexOf(this._handler[event],handler))){
                        this._handler[event].splice(index,1);
                    }

                    switch(event){
                        case 'timeupdate':
                            this._el.detachEvent('PositionChange', handler);
                            break;
                        case 'waiting':
                        case 'playing':
                            if(!(this._handler['waiting'] && this._handler['waiting'].length) && !(this._handler['playing'] && this._handler['playing'].length)){
                                this._el.detachEvent('Buffering', this._onBuffering);
                            }
                            break;
                        /*case 'error':
                            this._el.Error = handler;
                            break;*/
                        default:
                            break;
                    }
                },
                _fire : function(event){
                    var events;
                    if(!this._handler || !(events = this._handler[event])){
                        return;
                    }
                    for(var i=0,len=events.length;i<len;i++){
                        events[i].call(this);
                    }
                },
                _startPoll : function(){
                    if(this._timer !== undefined){
                        return;
                    }
                    var context = this;
                    this._timer = setInterval(function(){
                        if((context._handler['timeupdate'] || 0).length){
                            context._fire('timeupdate');
                        }
                    },500);
                },
                _stopPoll : function(){
                    clearInterval(this._timer);
                    delete this._timer;
                }
            });
            break;
        default:
            break;
    }
});
