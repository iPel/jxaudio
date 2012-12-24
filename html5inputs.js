/**
html5inputs : html5 new type inputs cross browsers support plugin
Copyright (C) 2012 James Li
Version:1.0.1

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
**/

(function (window){
	//-------------global functions includes----------------------//
	/**
	_addEvent: add events handler(cross browsers);
	id:get dom by id;
	nm:get dom by name(support tag name filter);
	cls:get dom by class(support tag name filter);
	getStyle:get dom current style value(cross browsers);
	createDom:create dom while/not binding attributes(cross browsers);
	insertAfter:like native function insertBefore, insert a dom after another;
	pageX/pageY:get dom offset position from body;
	domDrag:add drag event to dom;
	**/
	//addEvent
	var _addEvent=function(element,type,fn){
		if(document.addEventListener)
			return element.addEventListener(type,fn,false);
		else if(document.attachEvent)
			return element.attachEvent("on"+type,fn);
		else
			return element["on"+type]=fn;
	},
	//get dom by id
	id=function(d){if(!d){return;}return document.getElementById(d);},
	//get doms by name
	nm=function(n,tag){
		if(!n){return;}
		if(!tag){
			return document.getElementsByName(n);
		}else{
			var elms=document.getElementsByTagName(tag||"*");
			var r=[];
			for(var i=0;i<elms.length;i++){
				if(elms[i].name==n)
					r.push(elms[i]);
			}
			return r;
		}
	},
	//get doms by class
	cls=function(c,tag){
		if(!c){return}
		var reg=new RegExp(c,"g");
		var elms=document.getElementsByTagName(tag||"*");
		var r=[];
		for(var i=0;i<elms.length;i++){
			if(reg.test(elms[i].className))
				r.push(elms[i]);
		}
		return r;
	},
	getStyle=function(elm,name){
		if(elm.style[name])
		return elm.style[name];
		else if(elm.currentStyle)
		return elm.currentStyle[name];
		else if(document.defaultView&&document.defaultView.getComputedStyle){
			name=name.replace(/([A-Z])/g,"-$1");
			name=name.toLowerCase();
			var s=document.defaultView.getComputedStyle(elm,"");
			return s&&s.getPropertyValue(name);
		}else{
			return null;
		}
	},
	//createDom
	createDom=function(elm,attr){
		if(!attr)attr={};
		try{
			var a=" ";
			for(var i in attr){
				if(i!=="className")
					a+=i+"=\""+attr[i]+"\" ";
				else
					a+="class=\""+attr[i]+"\" ";
			}
		
			var e=document.createElement("<"+elm+a+"></"+elm+">");
			return e;
		}
		catch(e){
			var e=document.createElement(elm);
			for(var i in attr){
				if(i!=="className")
					e.setAttribute(i,attr[i]);
				else
					e.setAttribute("class",attr[i]);
			}
			return e;
		}
	},
	//insert after
	insertAfter=function(newElm,oldElm){
		var doms=oldElm.parentNode.children;
		for(var i=0;i<doms.length;i++){
			if(oldElm==doms[i]){
				if(i==doms.length-1)
					oldElm.parentNode.appendChild(newElm);
				else
					oldElm.parentNode.insertBefore(newElm,oldElm.nextSibling);
			}
		}	
	},
	//pagex,pagey
	pageX=function(elm){return elm.offsetParent ? elm.offsetLeft+pageX(elm.offsetParent) : elm.offsetLeft},
	pageY=function(elm){return elm.offsetParent ? elm.offsetTop+pageY(elm.offsetParent) : elm.offsetTop},
	//domdrag
	domDrag=function(space,trigger,stepx,stepy,direction,funcs){
		//funcs:object{ondragstart:fn,ondragging:fn,ondragend:fn}
		var s=space,t=trigger;
		if(!s || !t){return};
		if(!stepx)stepx=1;
		if(!stepy)stepy=1;
		if(direction==undefined)direction="";
		var d=/[vertical|horizonal|all]/.test(direction) ? direction : "all";
		var dragging=false;
		_addEvent(t,"mousedown",function(e){
			dragging=true;
			e=e || window.event;
			t.x0=e.clientX-pageX(t);
			t.y0=e.clientY-pageY(t);
			if(funcs && funcs.ondragstart)
				funcs.ondragstart();
			//fix for w3c
			if(!!e.preventDefault){
				e.preventDefault();
			}
		});
		_addEvent(s,"mouseup",function(){
			dragging=false;
			if(funcs && funcs.ondragend)
				funcs.ondragend();
		});
		_addEvent(s,"mousemove",function(e){
			if(dragging){
				e=e || window.event;
				if(d=="horizontal"){
					var left=pageX(s);
					t.x=e.clientX-left;
					if(t.x>0 && t.x<=s.offsetWidth)
						t.style["left"]=Math.round(t.x/stepx)*stepx-t.x0+"px";
				}else if(d=="vertical"){
					var top=pageY(s);
					t.y=e.clientY-top;
					if(t.y>0 && t.y<=s.offsetHeight)
						t.style["top"]=Math.round(t.y/stepy)*stepy-t.y0+"px";
				}else if(d=="all"){				
					var left=pageX(s),top=pageY(s);
					t.x=e.clientX-left,t.y=e.clientY-top;
					if(t.x>0 && t.x<=s.offsetWidth)
						t.style["left"]=Math.round(t.x/stepx)*stepx-t.x0+"px";
					if(t.y>0 && t.y<=s.offsetHeight)
						t.style["top"]=Math.round(t.y/stepy)*stepy-t.y0+"px";
				}
				if(funcs && funcs.ondragging)
				funcs.ondragging();
			}
		});
	},
	
	//----------------public object: get specified input--------------//
	html5Inputs=function(elm){	
		if(!elm){return}
		//get physical type which writen in the input tag
		var type=elm.getAttribute("type");
		return new html5Inputs.fn.init(elm,type);
	};
	
	html5Inputs.fn=html5Inputs.prototype;

	//initialize fn
	html5Inputs.fn.init=function(elm,type){
		if(type===elm.type){
			this.bindChange()
		}else{
			if(type==="range"){
				this.buildRange(elm);
			}else if(type==="color"){
				this.buildColor(elm);
			}
		}
		return this;
	};
	html5Inputs.fn.init.prototype=html5Inputs.fn;
	
	html5Inputs.prototype.buildRange=function(e){
		//-------------Input : Range------------------//
		//degrade gracefully,for those browser not support this type
		/**
		Create Elements(3):range_bar,range_wheel,range_tip;
		Input Properties Used:min,max,step,value;
		Event Support: mouse drag, keypress(left and right)
		**/
		e.style.display="none";
		var min=parseInt(e.getAttribute("min")),
			max=parseInt(e.getAttribute("max")),
			value=e.getAttribute("value") ? parseInt(e.getAttribute("value")) : min,
			step=e.getAttribute("step") ? parseInt(e.getAttribute("step")) : 1,
			ename=e.getAttribute("name"),
			physicalStep,//logical width per step（px/1）
			wheel_active=false,
			bar_class,bar,wheel_class,wheel,tip_class,tip,
			_this=this;
		
		//bar
		bar_class="input_range_bar";
		bar=createDom("span",{className:bar_class});
		e.parentNode.insertBefore(bar,e);
		
		//physicalStep
		physicalStep=(parseInt(getStyle(bar,"width"))/(max-min));
		//wheel
		wheel_class="input_range_wheel";
		wheel=createDom("button",{href:"javascript:void(0)",className:wheel_class});
		wheel.style["left"]=(value-min)*physicalStep+"px";
		bar.appendChild(wheel);
		
		//tip
		tip_class="input_range_tip";
		tip=createDom("span",{className:tip_class,id:ename});
		tip.innerHTML=value;
		insertAfter(tip,bar);
		
		//drag events
		domDrag(bar,wheel,step*physicalStep,1,"horizontal",{ondragging:function(){
			var value=Math.ceil(parseInt(wheel.style["left"])/physicalStep+min);
			tip.innerHTML=value;
			e.value=value;
			_this.callback();
		}});
		
		//keyboard events
		_addEvent(wheel,"focus",function(){wheel_active=true;});
		_addEvent(wheel,"blur",function(){wheel_active=false;});
		_addEvent(document,"keydown",function(e){
			e=e||window.event;
			if(wheel_active){
				//key left press
				if(e.keyCode && e.keyCode==37 && parseInt(tip.innerHTML)>=min+step){
					var current=parseInt(tip.innerHTML)-step;
					wheel.style["left"]=(current-min)*physicalStep+"px";
					tip.innerHTML=current;
					e.value=current;
					_this.callback();
				}
				//key right press
				if(e.keyCode && e.keyCode==39 && parseInt(tip.innerHTML)<=max-step){
					var current=parseInt(tip.innerHTML)+step;
					wheel.style["left"]=(current-min)*physicalStep+"px";
					tip.innerHTML=current;
					e.value=current;
					_this.callback();
				}
			}
		});
	}
	
	html5Inputs.prototype.buildColor=function(e){
		/**
		Create Elements():current,picker_quick,standard
		**/
		e.style.display="none";
		var current_class,current,
			picker_quick_class,picker_quick,
			standard_class=[],standard,
			more_btn_class,more_btn,
			picker_full_class,picker_full,
			canvas_class,canvas,
			picker_full_tip_class,picker_full_tip,
			sub_current_class,sub_current,
			full_submit_class,full_submit,
			full_reset_class,full_reset,
			picker_r,
			_this=this;
		
		//current
		current_class="input_color_current";
		current=createDom("a",{className:"input_color_single "+current_class,href:"javascript:void(0)",id:e.name});
		e.parentNode.insertBefore(current,e);
		
		//picker_quick
		picker_quick_class="input_color_picker_quick";
		picker_quick=createDom("div",{className:picker_quick_class});
		picker_quick.style["display"]="none";
		picker_quick.style["left"]="-9999px";
		picker_quick.style["top"]="-9999px";
		document.body.appendChild(picker_quick);
		
		//standards(17 colors)
		standard_class=["input_color_black","input_color_silver","input_color_gray","input_color_navy","input_color_blue",
						"input_color_aqua","input_color_teal","input_color_purple","input_color_fuchsia","input_color_white",
						"input_color_lime","input_color_green","input_color_maroon","input_color_red","input_color_orange",
						"input_color_yellow","input_color_olive"];
		for(var i=0;i<standard_class.length;i++){
			standard=createDom("a",{href:"javascript:void(0)",className:"input_color_single "+standard_class[i]});
			picker_quick.appendChild(standard);
		};
		
		//more_btn
		more_btn_class="input_color_more";
		more_btn=createDom("button",{className:more_btn_class,type:"button"});
		more_btn.innerHTML="其他......"
		picker_quick.appendChild(more_btn);
	
		//picker_full
		picker_full_class="input_color_picker_full";
		picker_full=createDom("div",{className:picker_full_class});
		picker_full.style["display"]="none";
		picker_full.style["left"]="-9999px";
		picker_full.style["top"]="-9999px";
		document.body.appendChild(picker_full);
		
		//picker_canvas or color_range
		canvas_class="input_color_canvas";
		canvas=createDom("canvas",{className:canvas_class,id:canvas_class,width:310,height:280});
		if(!!canvas.getContext){
			picker_full.appendChild(canvas);
			var cvs=new canvasColorPicker(canvas_class);
		}else{
			var color_range=new buildColorRange(picker_full);
		}
		
		//picker_full_tip
		picker_full_tip_class="input_color_full_tip";
		picker_full_tip=createDom("p",{className:picker_full_tip_class});
		picker_full_tip.innerHTML="当前选择的颜色是："
		picker_full.appendChild(picker_full_tip);
		
		//sub_current
		sub_current_class="input_color_sub_current";
		sub_current=createDom("span",{className:"input_color_single "+sub_current_class});
		sub_current.innerHTML="-";
		picker_full_tip.appendChild(sub_current);
		if(!!canvas.getContext){
			_addEvent(canvas,"click",function(){
				var color=cvs.getColor();
				if(color.length>0){
					sub_current.innerHTML=color;
					sub_current.style["backgroundColor"]=color;
				}
			});
		}else{
			_addEvent(picker_full,"mousemove",function(){
				var color=color_range.getColor();
				if(color.length>0){
					sub_current.innerHTML=color;
					sub_current.style["backgroundColor"]=color;
				}
			});
			_addEvent(document,"keydown",function(e){
				e=e||window.event;
				if(e.keyCode==37 || e.keyCode==39){
					var color=color_range.getColor();
					if(color.length>0){
						sub_current.innerHTML=color;
						sub_current.style["backgroundColor"]=color;
					}
				}
			});
		}
		
		//full_submit
		full_submit_class="input_color_full_submit";
		full_submit=createDom("button",{className:full_submit_class,type:"submit"});
		full_submit.innerHTML="确定";
		picker_full_tip.appendChild(full_submit);
		_addEvent(full_submit,"click",function(){
			var color=sub_current.innerHTML;
			if(color.length>1){
				setColor(color);
			}
		})
		
		//full_reset
		full_reset_class="input_color_full_reset";
		full_reset=createDom("button",{className:full_reset_class,type:"reset"});
		full_reset.innerHTML="取消";
		picker_full_tip.appendChild(full_reset);
		_addEvent(full_reset,"click",function(){
			picker_full.style["display"]="none";
		})
		
		//other events
		//toggle picker_quick
		_addEvent(current,"click",function(){
			if(picker_quick.style["display"]=="none"){
				picker_quick.style["display"]="block";
				picker_quick.style["left"]=pageX(current)+"px";
				picker_quick.style["top"]=(pageY(current)+current.offsetHeight)+"px";
			}else{
				picker_quick.style["display"]="none";
				picker_quick.style["left"]="-9999px";
				picker_quick.style["top"]="-9999px";
			}
		})
			
		//toggle picker_full
		_addEvent(more_btn,"click",function(){
			if(picker_full.style["display"]=="none"){
				picker_full.style["display"]="block";
				picker_full.style["left"]=(pageX(picker_quick)+picker_quick.offsetWidth)+"px";
				picker_full.style["top"]=pageY(picker_quick)+"px";
				if(!!canvas.getContext){
					cvs.o.canvas.winX=pageX(cvs.o.canvas);
					cvs.o.canvas.winY=pageY(cvs.o.canvas);
				}
			}else{
				picker_full.style["display"]="none";
				picker_full.style["left"]="-9999px";
				picker_full.style["top"]="-9999px";
			}
		})
		
		//chose color by default
		var setColor=function(color){
			current.style["backgroundColor"]=color;
			e.value=color;
			picker_quick.style["display"]="none";
			picker_full.style["display"]="none";
			_this.callback();
		}
		for(var i=0;i<standard_class.length;i++)(function(j){
			var single=picker_quick.children[j];
			var single_color=getStyle(single,"backgroundColor");
			_addEvent(single,"click",function(){
				setColor(single_color);
			})	
		})(i);
	}
	
	//total callback fn(custom define)
	html5Inputs.prototype.callback=function(){};
	
	//normal bind callback for browsers which support current type
	html5Inputs.prototype.bindChange=function(){
		var _this=this;
		_addEvent(e,"change",function(){
			_this.callback();
		})
	}
/**
以下为input type=color时提供的基于canvas的全色拾色器，编写时使用了之前编写的canvas框架potato.js，在使用时需要先加载该框架;
对于不支持canvas的浏览器（IE9以下），下面也提供了另一种基于input range的滚动条取色器（buildColorRange）.
**/
//-----------------object: canvas color picker(REQUIRE:potato.js)---------//
	var canvasColorPicker=function(id){
		if(!!CanvasBase){
			var c=new CanvasBase(id);
			var context=c.context;
			var s0=1,v0=255,h0=360,RGBMAX=255;
			var cbox=[10,10,256,256];
			var hbar=[280,10,20,256];
			var currentHue=0;
			var currentRGB,rgbHex="",inbar=false,inbox=false,_this=this;
			//HSV/HSB颜色转换成RGB颜色
			function HSV2RGB(h,s,v){
				var hi=Math.floor((h/60))%6;
				f=h/60-hi;
				p=Math.round(v*(1-s));
				q=Math.round(v*(1-f*s));
				t=Math.round(v*(1-(1-f)*s));
				var rgb=[];
				switch(hi){
					case 0:
					rgb= [v,t,p];
					break;
					case 1:
					rgb= [q,v,p];
					break;
					case 2:
					rgb= [p,v,t];
					break;
					case 3:
					rgb= [p,q,v];
					break;
					case 4:
					rgb= [t,p,v];
					break;
					default:
					rgb= [v,p,q];
				}
				return rgb;
			}
			//色相条
			function hueBar(x,y,width,height){
				for(var i=0;i<height;i++){
					var rgb=HSV2RGB(i/height*h0,s0,v0);
					context.beginPath();
					context.rect(x,y+height-1-i,width,1);
					context.fillStyle="rgb("+rgb.join(",")+")";
					context.fill();
				}
			}
			//等色相下饱和度S和色调V（明度B）的色盘
			function svBox(x,y,width,height,hue){
				for(var i=0;i<width;i++){
					for(var j=0;j<height;j++){
						var s=i/(width-1);
						var v=(height-1)-j;
						var rgb=HSV2RGB(hue,s,v);
						context.beginPath();
						context.rect(x+i,y+j,1,1);
						context.fillStyle="rgb("+rgb.join(",")+")";
						context.fill();
					}
				}
			}
			//色相条两侧指示箭头
			var barPointer=function(x,y,r,dist){
				this.x=x;
				this.y=y;
				this.r=r;
				this.draw=function(){
					context.beginPath();
					context.moveTo(x-dist,y);
					context.lineTo(x-r*2-dist,y-r);
					context.lineTo(x-r*2-dist,y+r);
					context.closePath();
					context.moveTo(x+dist,y);
					context.lineTo(x+r*2+dist,y-r);
					context.lineTo(x+r*2+dist,y+r);
					context.closePath();
					context.strokeStyle="#999";
					context.stroke();
					context.fillStyle="#fff";
					context.fill();
				}
			}
			
			hueBar(hbar[0],hbar[1],hbar[2],hbar[3]);
			svBox(cbox[0],cbox[1],cbox[2],cbox[3],1);
			var point1=new barPointer(hbar[0]+hbar[2]/2,hbar[1],3,10);
			point1.draw();
			
			this.getColor=function(){return rgbHex;}
			//鼠标事件
			_addEvent(c.canvas,"mousemove",function(){
				if(c.canvas.x>=hbar[0] && c.canvas.x<hbar[0]+hbar[2] && c.canvas.y>hbar[1] && c.canvas.y<=hbar[1]+hbar[3]){
					var hue=(hbar[1]+hbar[3]-c.canvas.y)/hbar[3]*h0;
					currentRGB=HSV2RGB(hue,s0,v0);
					inbar=true;
				}else{inbar=false;}
				if(c.canvas.x>=cbox[0] && c.canvas.x<cbox[0]+cbox[2] && c.canvas.y>=cbox[1] && c.canvas.y<cbox[1]+cbox[3]){
					var s=(c.canvas.x-cbox[0])/(cbox[2]-1);
					var v=cbox[3]-1-(c.canvas.y-cbox[1]);
					currentRGB=HSV2RGB(currentHue,s,v);
					inbox=true;
				}else{inbox=false;}
			});
			
			_addEvent(c.canvas,"click",function(){
				if(inbar || inbox){
					if(inbar){
						//Huebar arrow
						context.clearRect(hbar[0]-10,0,10,c.canvas.height);
						context.clearRect(hbar[0]+hbar[2],0,10,c.canvas.height);
						var point1=new barPointer(hbar[0]+hbar[2]/2,c.canvas.y,3,10);
						point1.draw();
						//change color box
						currentHue=(hbar[1]+hbar[3]-c.canvas.y)/hbar[3]*h0;
						svBox(cbox[0],cbox[1],cbox[2],cbox[3],currentHue);
					}
					var r=parseInt(currentRGB[0]).toString(16);			
					var g=parseInt(currentRGB[1]).toString(16);				
					var b=parseInt(currentRGB[2]).toString(16);
					if(r.length==1)r="0"+r;
					if(g.length==1)g="0"+g;
					if(b.length==1)b="0"+b;
					rgbHex="#"+r+g+b;
				}
			});
			this.o=c;
		}
	},

	buildColorRange=function(_parent){
		var p=_parent;
		var range_r,p_r,tip_r,
			range_g,p_g,tip_g,
			range_b,p_b,tip_b,
			range1,range2,range3,
			rgbHex="";

		range_r=createDom("input",{type:"range",min:0,max:255,name:"color_range_r"})
		range_g=createDom("input",{type:"range",min:0,max:255,name:"color_range_g"})
		range_b=createDom("input",{type:"range",min:0,max:255,name:"color_range_b"});
		p_r=createDom("p",{className:"input_color_range_p"})
		p_g=createDom("p",{className:"input_color_range_p"})
		p_b=createDom("p",{className:"input_color_range_p"});
		tip_r=createDom("span",{className:"input_color_single input_color_red"});
		tip_g=createDom("span",{className:"input_color_single input_color_green"});
		tip_b=createDom("span",{className:"input_color_single input_color_blue"});
		p_r.appendChild(tip_r);
		p_r.appendChild(range_r);
		p_g.appendChild(tip_g);
		p_g.appendChild(range_g);
		p_b.appendChild(tip_b);
		p_b.appendChild(range_b);
		p.appendChild(p_r);
		p.appendChild(p_g);
		p.appendChild(p_b);
		
		range1=html5Inputs(range_r,"range");
		range2=html5Inputs(range_g,"range");
		range3=html5Inputs(range_b,"range");
		
		range1.callback=changeFullColor;
		range2.callback=changeFullColor;
		range3.callback=changeFullColor;
		
		function changeFullColor(){
			var r=parseInt(id("color_range_r").innerHTML).toString(16),
				g=parseInt(id("color_range_g").innerHTML).toString(16),
				b=parseInt(id("color_range_b").innerHTML).toString(16);
			if(r.length==1)r="0"+r;
			if(g.length==1)g="0"+g;
			if(b.length==1)b="0"+b;
			rgbHex="#"+r+g+b;
		}
		
		this.getColor=function(){return rgbHex;}
	};

	//give public functions
	window.html5Inputs=html5Inputs;

})(window);