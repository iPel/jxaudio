package  {
	
	/*
	##success
	play
	waiting
	loadstart
	progress
	suspend
	durationchange
	loadedmetadata
	loadeddata
	canplay
	canplaythrough
	playing
	timeupdate
	timeupdate
	pause
	ended
	*/
	
	import flash.display.Sprite;
	import flash.external.ExternalInterface;
	import flash.utils.Timer;
	import flash.events.TimerEvent;
	import flash.events.Event;
	
	public class AudioMgr extends Sprite {
		private var audioList:Array;
		//public var outputText:TextField;
		
		public function AudioMgr() {
			// constructor code
			// trace('...')
			//outputText.appendText('...\n');
			audioList = [];
			if(ExternalInterface.available){
				addEventListener(Event.ENTER_FRAME, registerExternalCallback, false);
			}/*else{
				load(0, 'msg.mp3');
				//setLoop(0, true);
				play(0);
				on(0,'timeupdate');
			}*/
			var timer:Timer = new Timer(500);
			timer.addEventListener(TimerEvent.TIMER, onTimer, false);
			timer.start();
		}
		public function load(seq:Number, url:String):void{
			var audio = audioList[seq] || (audioList[seq] = new Audio(seq));
			audio.load(url);
		}
		public function play(seq:Number):void{
			var audio = audioList[seq];
			if(audio){
				audio.play();
			}
		}
		public function pause(seq:Number):void{
			var audio = audioList[seq];
			if(audio){
				audio.pause();
			}
		}
		public function stop(seq:Number):void{
			var audio = audioList[seq];
			if(audio){
				audio.stop();
			}
		}
		public function setVolume(seq:Number, value:Number):void{
			var audio = audioList[seq];
			if(audio){
				audio.setVolume(value);
			}
		}
		public function setLoop(seq:Number, value:Boolean):void{
			var audio = audioList[seq];
			if(audio){
				audio.setLoop(value);
			}
		}
		public function getPosition(seq:Number):Number{
			var audio = audioList[seq];
			return audio ? audio.getPosition() : 0;
		}
		public function setPosition(seq:Number, value:Number):void{
			var audio = audioList[seq];
			if(audio){
				audio.setPosition(value);
			}
		}
		public function getBuffered(seq:Number):Number{
			var audio = audioList[seq];
			return audio ? audio.getBuffered() : 0;
		}
		public function getDuration(seq:Number):Number{
			var audio = audioList[seq];
			return audio ? audio.getDuration() : 0;
		}
		public function free(seq:Number):void{
			var audio = audioList[seq];
			if(audio){
				audio.free();
				audioList[seq] = null;
			}
		}
		public function on(seq:Number, event:String):void{
			var audio = audioList[seq];
			if(audio){
				audio.addEventListener(event, onEvent, false);
			}
		}
		public function off(seq:Number, event:String):void{
			var audio = audioList[seq];
			if(audio){
				audio.removeEventListener(event, onEvent, false);
			}
		}
		
		private function onTimer(event:Event = null):void{
			for(var i in audioList){
				audioList[i].checkStatus();
			}
		}
		private function onEvent(event:Event){
			ExternalInterface.available && ExternalInterface.call('Jx.AudioEventDispatcher', event.currentTarget.id, event.type, null);
			//trace(getDuration(0),getPosition(0));
		}
		private function registerExternalCallback(event:Event){
			removeEventListener(Event.ENTER_FRAME, registerExternalCallback, false);
			ExternalInterface.addCallback('audioLoad',load);
			ExternalInterface.addCallback('audioPlay',play);
			ExternalInterface.addCallback('audioPause',pause);
			ExternalInterface.addCallback('audioStop',stop);
			ExternalInterface.addCallback('audioSetVolume',setVolume);
			ExternalInterface.addCallback('audioSetLoop',setLoop);
			ExternalInterface.addCallback('audioGetPosition',getPosition);
			ExternalInterface.addCallback('audioSetPosition',setPosition);
			ExternalInterface.addCallback('audioGetBuffered',getBuffered);
			ExternalInterface.addCallback('audioGetDuration',getDuration);
			ExternalInterface.addCallback('audioFree',free);
			ExternalInterface.addCallback('audioOn',on);
			ExternalInterface.addCallback('audioOff',off);
		}
	}
}

	import flash.media.Sound;
	import flash.media.SoundChannel;
	import flash.media.SoundTransform;
	import flash.net.URLRequest;
	import flash.events.EventDispatcher;
	import flash.events.IOErrorEvent;
	import flash.events.Event;
	import flash.events.ProgressEvent;
	//import flash.external.ExternalInterface;
	import flash.utils.getTimer;
	
	internal const AudioEvent = {
		//ABORT : 'abort',
		CANPLAY : 'canplay',
		CANPLAYTHROUGH : 'canplaythrough',
		DURATIONCHANGE : 'durationchange',
		//EMPTIED : 'emptied',
		ENDED : 'ended',
		ERROR : 'error',
		LOADEDDATA : 'loadeddata',
		//LOADEDMETADATA : 'loadedmetadata',
		LOADSTART : 'loadstart',
		PAUSE : 'pause',
		PLAY : 'play',
		PLAYING : 'playing',
		PROGRESS : 'progress',
		//RATECHANGE : 'ratechange',
		SEEKED : 'seeked',
		SEEKING : 'seeking',
		//STALLED : 'stalled',
		//SUSPEND : 'suspend',
		TIMEUPDATE : 'timeupdate',
		VOLUMECHANGE : 'volumechange',
		WAITING : 'waiting'
	};
	
	internal class Audio extends EventDispatcher {
		internal var id:Number;
		private var sound:Sound;
		private var channel:SoundChannel;
		private var isPlaying:Boolean;
		private var position:Number;
		private var volume:Number;
		private var loop:Boolean;
		private var isBuffering:Boolean = false;
		private var loadedDataFired:Boolean;
		private var isBuffered:Boolean;
		private var isError:Boolean;
		private var progressTs:Number;

		public function Audio(id) {
			sound = new Sound();
			this.id = id;
			volume = 1;
			sound.addEventListener(IOErrorEvent.IO_ERROR, onError, false);
			sound.addEventListener(ProgressEvent.PROGRESS, onProgress, false);
			sound.addEventListener(Event.OPEN, onLoadStart, false);
			sound.addEventListener(Event.COMPLETE, onCanPlayThrough, false);
		}
		internal function load(url:String):void {
			isBuffering = false;
			loadedDataFired = false;
			isBuffered = false;
			isError = false;
			progressTs = -Infinity;
			sound.load(new URLRequest(url));
			position = 0;
		}
		internal function play():void {
			this.dispatchEvent(new Event(AudioEvent.PLAY));
			checkStatus();
			if(!isPlaying){
				playSound();
			}
		}
		internal function pause():void {
			pauseSound();
			this.dispatchEvent(new Event(AudioEvent.PAUSE));
		}
		internal function stop():void {
			pauseSound();
			position = 0;
			onEnded();
		}
		internal function setVolume(value:Number):void {
			volume = value;
			if(isPlaying){
				setSoundVolume();
			}
			this.dispatchEvent(new Event(AudioEvent.VOLUMECHANGE));
		}
		internal function setLoop(value:Boolean):void{
			loop = value;
		}
		internal function getPosition():Number{
			if(isPlaying){
				return channel.position;
			}else{
				return position;
			}
		}
		internal function setPosition(value:Number):void{
			this.dispatchEvent(new Event(AudioEvent.SEEKING));
			if(isPlaying){
				pauseSound();
				position = value;
				this.dispatchEvent(new Event(AudioEvent.TIMEUPDATE));
				playSound();
			}else{
				position = value;
				this.dispatchEvent(new Event(AudioEvent.TIMEUPDATE));
			}
			this.dispatchEvent(new Event(AudioEvent.SEEKED));
		}
		internal function getBuffered():Number{
			return sound.length;
		}
		internal function getDuration():Number{
			return sound.bytesLoaded && sound.length*sound.bytesTotal/sound.bytesLoaded || 0;
		}
		internal function free():void{
			if(isPlaying){
				channel.stop();
			}
			try{
				sound.close();
			}catch(e:Error){
			}
		}
		internal function checkStatus():void{
			//_trace('sound.isBuffering:'+sound.isBuffering+' isBuffering:'+isBuffering);
			if(isError){
				return;
			}
			if(!isBuffering){
				if(!isBuffered && sound.isBuffering){
					isBuffering = true;
					this.dispatchEvent(new Event(AudioEvent.WAITING));
				}else if(isPlaying){
					this.dispatchEvent(new Event(AudioEvent.TIMEUPDATE));
				}
			}
		}
		
		private function playSound():void{
			isPlaying = true;
			channel = sound.play(position, 0, volume<1?new SoundTransform(volume):null);
			channel.addEventListener(Event.SOUND_COMPLETE, onEnded, false);
		}
		private function pauseSound():void{
			isPlaying = false;
			position = channel.position;
			channel.stop();
		}
		private function setSoundVolume():void {
			var transform:SoundTransform = channel.soundTransform;
			transform.volume = volume;
			channel.soundTransform = transform;
		}
		
		private function onError(event:Event = null):void{
			//_trace(AudioEvent.ERROR);
			this.dispatchEvent(new Event(AudioEvent.ERROR));
		}
		private function onProgress(event:Event = null):void{
			var ts = getTimer();
			if(ts - progressTs > 500){
				//trace(ts);
				progressTs = ts;
				//_trace(AudioEvent.PROGRESS);
				this.dispatchEvent(new Event(AudioEvent.PROGRESS));
			}
			if(isBuffering && !sound.isBuffering){ //check if the increasing data enough
				isBuffering = false;
				if(!loadedDataFired){
					if(sound.length > 0){
						this.dispatchEvent(new Event(AudioEvent.DURATIONCHANGE));
					}
					loadedDataFired = true;
					this.dispatchEvent(new Event(AudioEvent.LOADEDDATA));
				}
				this.dispatchEvent(new Event(AudioEvent.CANPLAY));
				if(isPlaying){
					this.dispatchEvent(new Event(AudioEvent.PLAYING));
				}
			}
		}
		private function onEnded(event:Event = null):void{
			if(isError){
				return;
			}
			if(isPlaying && loop){
				setPosition(0);
			}else if(isPlaying && sound.length > channel.position){
				isError = true;
				onError();
			}else{
				position=0;
				isPlaying = false;
				//_trace(AudioEvent.ENDED);
				this.dispatchEvent(new Event(AudioEvent.ENDED));
			}
		}
		private function onLoadStart(event:Event = null):void{
			//_trace(AudioEvent.LOADSTART);
			this.dispatchEvent(new Event(AudioEvent.LOADSTART));
		}
		private function onCanPlayThrough(event:Event = null):void{
			isBuffered = true;
			if(isBuffering){ //check if the increasing data enough
				isBuffering = false;
				if(!loadedDataFired){
					if(sound.length > 0){
						this.dispatchEvent(new Event(AudioEvent.DURATIONCHANGE));
					}
					loadedDataFired = true;
					this.dispatchEvent(new Event(AudioEvent.LOADEDDATA));
				}
				this.dispatchEvent(new Event(AudioEvent.CANPLAY));
				if(isPlaying){
					this.dispatchEvent(new Event(AudioEvent.PLAYING));
				}
			}
			//_trace(AudioEvent.CANPLAYTHROUGH);
			this.dispatchEvent(new Event(AudioEvent.CANPLAYTHROUGH));
		}
		
		/*private function _trace(value){
			if(ExternalInterface.available){
				ExternalInterface.call('console.log',value);
			}else{
				trace(value);
			}
		}*/
	}
