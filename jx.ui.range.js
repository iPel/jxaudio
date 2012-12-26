;Jx().$package(function(J){
    var $D = J.dom,
        $E = J.event;
    var buildRange = function(el){
        if('static' === J.dom.getStyle(el, 'position')){
            el.style.cssText += ';position:relative;left:auto;top:auto;right:auto;bottom:auto;visibility:hidden;';
        }
        var wrapEl = document.createElement('div');
        wrapEl.style.cssText = 'overflow:hidden;position:absolute;left:'+el.offsetLeft+'px;top:'+el.offsetTop+
            'px;width:'+el.offsetWidth+'px;height:'+el.offsetHeight+'px;';
        var trackEl = document.createElement('div');
        trackEl.style.cssText = 'width:100%;height:2px;position:absolute;left:0;top:50%;margin-top:-2px;border:1px solid #666;background:#ccc;overflow:hidden;';
        wrapEl.appendChild(trackEl);
        var thumbEl = document.createElement('button');
        thumbEl.style.cssText = 'width:12px;height:16px;position:absolute;left:5px;top:50%;margin-top:-8px;padding:0;';
        wrapEl.appendChild(thumbEl);
        el.parentNode.appendChild(wrapEl);

        var max = Number(el.getAttribute('max')),
            min = Number(el.getAttribute('min')),
            step = el.getAttribute('step'),
            value = el.value,
            maxLeft = wrapEl.clientWidth - thumbEl.offsetWidth,
            trackClickOffset = thumbEl.offsetWidth / 2;
        if(!isFinite(min)){
            min = 0;
        }
        if(!isFinite(max) || max <= min){
            max = min + 1;
        }
        if(!isFinite(step) || step < 0){
            step = 0;
        }
        if(!isFinite(value) || value < min){
            value = min;
        }else if(value >max){
            value = max;
        }
        var updateThumb = function(value){
            thumbEl.style.left = maxLeft * (value - min) / (max - min) + 'px';
        }
        J.event.on(wrapEl, 'click', function(e){
            if(e.target !== thumbEl){
                var newLeft = e.layerX - trackClickOffset,
                    newValue;
                if(newLeft <= 0){
                    newValue = min;
                }else if(newLeft >= maxLeft){
                    newValue = max;
                }else if(step){
                    newValue = min + Math.round((max - min) * newLeft / maxLeft / step) * step;
                }else{
                    newValue = min + (max - min) * newLeft / maxLeft;
                }
                if(newValue !== value){
                    updateThumb(newValue);
                    el.value = value = newValue;
                    if(el.fireEvent){
                        el.fireEvent('onchange');
                    }else if(el.dispatchEvent){
                        var evt = document.createEvent('Event');
                        evt.initEvent('change', false, true);
                        el.dispatchEvent(evt);
                    }
                }
            }
        });
        J.event.on(thumbEl, 'mousedown', function(e){
            var x = e.screenX, left = parseInt(thumbEl.style.left, 10);
            var onMouseMove = function(e){
                var newLeft = left + e.screenX - x,
                    newValue;
                if(newLeft <= 0){
                    newValue = min;
                }else if(newLeft >= maxLeft){
                    newValue = max;
                }else if(step){
                    newValue = min + Math.round((max - min) * newLeft / maxLeft / step) * step;
                }else{
                    newValue = min + (max - min) * newLeft / maxLeft;
                }
                if(newValue !== value){
                    updateThumb(newValue);
                    el.value = value = newValue;
                    if(el.fireEvent){
                        el.fireEvent('onchange');
                    }else if(el.dispatchEvent){
                        var evt = document.createEvent('Event');
                        evt.initEvent('change', false, true);
                        el.dispatchEvent(evt);
                    }
                }
            };
            var onMouseUp = function(e){
                J.event.off(document, 'mousemove', onMouseMove);
                J.event.off(document, 'mouseup', onMouseUp);
            };
            J.event.on(document, 'mousemove', onMouseMove);
            J.event.on(document, 'mouseup', onMouseUp);
        });
        var onModifed = function(event){
            if(event.propertyName === 'value' && el.value != value){
                value = el.value;
                updateThumb(value);
            }
        };
        if(el.__defineSetter__){
            // var setter = el.__lookupSetter__('value');
            el.__defineSetter__('value',function(val){
                if(val != value){
                    value = val;
                    updateThumb(value);
                }
            });
            el.__defineGetter__('value',function(){
                return value;
            });

        }else if('onpropertychange' in el){
            el.attachEvent('onpropertychange', onModifed);
        }else{

        }
        updateThumb(el.value);
    };
    (J.ui || (J.ui = {})).range = {
        build : buildRange
    };
});

