Jx声音插件
=======

Jx声音插件, 通过"Html5 Audio -> Flash控件 -> WMP控件"兼容各大浏览器.
支持常用的Html5 Audio方法和事件.
用法:
  先引入jx库,
  <script type="text/javascript" src="jx.uiless.js"></script>
  再引入audio插件,
	<script type="text/javascript" src="jx.audio.js"></script>
  再把jxaudioobject.swf放到你的项目下(Flash模式时需要用到).

示例一:
  new J.Audio({src:'msg.mp3',loop:true});

示例二:
  var audio = new J.Audio();
  audio.on('durationchange',function(){
    console.log(audio.getDuration);
  });
  audio.play('msg.mp3');

<a href="http://ipel.github.com/jxaudio/index.html">Demo 1</a>
<a href="http://ipel.github.com/jxaudio/audioplayer.html">Demo 2</a>
  
