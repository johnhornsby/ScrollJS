var TouchScrollPanel = function(options){
	EventDispatcher.call(this);
	if(options === undefined) return;				// inheritance handling
	
	this._frameElement = options.frameElement;
	this._contentElement = options.contentElement;
	this._scrollDirection = options.scrollDirection || TouchScrollPanel.SCROLL_DIRECTION_VERTICAL;
	
	this._thumbElement;
	this._thumbContainerElement;
	this._lastX = 0;
	this._lastY = 0;
	this._originX = 0;
	this._originY = 0;
	this._leftDelta = 0;
	this._topDelta = 0;
	this._isDragging = false;
	this._downStartTime = 0;
	this._isStopChildMouseUp = false;
	this._isAnimating = false;
	
	this._inertiaInterval = undefined;
	this._fadeThumbInterval = undefined;
	this._fadeThumbTimeout = undefined;
	this._isThumbVisible;
	
	this._y = 0;
	this._x = 0;
	
	this._inertiaInterval;
	this._friction = 0.9;
	this._inertia = 0;
	this._velocity = 0;
	this._acceleration = 0;
	this._containerDimension = 0;
	this._frameDimension = 0;
	this._contentHeight = 0;
	this._stylePosition = "";
	this._styleDimension = "";
	this._thumbDimension = 0;
	this._thumbPosition = 0;
	
	this.init();
};
//inheritance
TouchScrollPanel.prototype = new EventDispatcher();
TouchScrollPanel.prototype.constructor = TouchScrollPanel;
TouchScrollPanel.prototype.supr = EventDispatcher.prototype;

TouchScrollPanel.SCROLL_DIRECTION_VERTICAL = 0;
TouchScrollPanel.SCROLL_DIRECTION_HORIZONTAL = 1;
TouchScrollPanel.MOUSE_DRAG_MODIFIER = 2;
TouchScrollPanel.CLICK_THRESHOLD_DURATION = 500 // milliseconds 500
TouchScrollPanel.CLICK_THRESHOLD_DISTANCE = 10 // pixels






//PRIVATE
//__________________________________________________________________________________________
TouchScrollPanel.prototype.init = function(){
	$(this._frameElement).bind('mousewheel',this.onMouseWheelHandler.context(this));
	$(this._frameElement).bind('DOMMouseScroll',this.onDOMMouseScrollHandler.context(this));
	$(this._frameElement).bind('mousedown',this.onDownFrameHandler.context(this));
	$(this._frameElement).bind('touchstart',this.onDownFrameHandler.context(this));
	//addEvent(this._frameElement,'touchstart',this.onDownFrameHandler.context(this));
	this.build();
	//window.requestAnimFrame(this.updateInertiaAnimation.context(this));
};

TouchScrollPanel.prototype.build = function(){
	switch(this._scrollDirection){
		case TouchScrollPanel.SCROLL_DIRECTION_VERTICAL:
			$(this._frameElement).append('<div class="touchScrollPanelVerticleThumbContainer"><div class="touchScrollPanelVerticleThumb"><div class="touchScrollPanelThumbGraphics"></div></div></div>');
			this._thumbElement = $(this._frameElement).find('.touchScrollPanelVerticleThumb')[0];
			this._thumbContainerElement = $(this._frameElement).find('.touchScrollPanelVerticleThumbContainer')[0];
			break;
		case TouchScrollPanel.SCROLL_DIRECTION_HORIZONTAL:
			$(this._frameElement).append('<div class="touchScrollPanelHorizontalThumbContainer"><div class="touchScrollPanelHorizontalThumb"><div class="touchScrollPanelThumbGraphics"></div></div></div>');
			this._thumbElement = $(this._frameElement).find('.touchScrollPanelHorizontalThumb')[0];
			this._thumbContainerElement = $(this._frameElement).find('.touchScrollPanelHorizontalThumbContainer')[0];
			break;
	}
	this.onFadeOutThumb();
	this.updateThumb();
};

TouchScrollPanel.prototype.onDownFrameHandler = function(e){
	console.log('onDownFrameHandler');
	this.stopTweenAnimation();
	//jTweener.removeTween(this._contentElement);
	var pageX;
	var pageY;
	var eventType = (e.type.indexOf('touch')!=-1)?'touch':'mouse';
	if(eventType==='touch'){
		if (e.targetTouches.length != 1){
			return false;
		}
		$(window).bind('touchmove',this.onMoveWindowHandler.rEvtContext(this));
		$(window).bind('touchend',this.onUpWindowHandler.rEvtContext(this));
		//addEvent(window,'touchmove',this.onMoveWindowHandler.context(this));
		//addEvent(window,'touchend',this.onUpWindowHandler.context(this));
		pageX = e.targetTouches[0].pageX;
		pageY = e.targetTouches[0].pageY; 
	}else{
		
		
		$(document).bind('mousemove',this.onMoveWindowHandler.rEvtContext(this));
		$(document).bind('mouseup',this.onUpWindowHandler.rEvtContext(this));
		pageX = e.pageX;
		pageY = e.pageY; 
	}
	this._topDelta = 0;
	this._leftDelta = 0;
	this._lastX = this._originX = pageX;
	this._lastY = this._originY = pageY;
	this._isDragging = false;
	//this._isStopChildMouseUp = false;
	this._downStartTime = new Date().getTime();
	
	this.onFadeInThumb();
	
	if(eventType!=='touch'){
		//// don't return false as this causes problems for child elements receiving event on iPad, return false on desktop as this stops highlighing text
		e.preventDefault();
		return false;
	}
	
	
};

TouchScrollPanel.prototype.onMoveWindowHandler = function(e){
	console.log('onMouseMoveContainer');
	var pageX;
	var pageY;
	var eventType = (e.type.indexOf('touch')!=-1)?'touch':'mouse';
	if(eventType==='touch'){
		if (e.targetTouches.length != 1){
			return false;
		}
		pageX = e.targetTouches[0].pageX;
		pageY = e.targetTouches[0].pageY; 
	}else{
		pageX = e.pageX;
		pageY = e.pageY; 
	}
	
	this._leftDelta = pageX - this._lastX;
	this._topDelta = pageY - this._lastY;
	
	switch(this._scrollDirection){
		case TouchScrollPanel.SCROLL_DIRECTION_VERTICAL:
			this.scrollY(this._topDelta,false);
			break;
		case TouchScrollPanel.SCROLL_DIRECTION_HORIZONTAL:
			this.scrollX(this._leftDelta,false);
			break;
	}
	
	this._lastX = pageX;
	this._lastY = pageY;
	var distanceMoved = Point.distance(new Point(pageX, pageY), new Point(this._originX, this._originY));			//check distance moved since mouse down
	var downTimeDuration = new Date().getTime() - this._downStartTime;													//check duration of mousedown and mouseup
	if(distanceMoved > TouchScrollPanel.CLICK_THRESHOLD_DISTANCE || downTimeDuration > TouchScrollPanel.CLICK_THRESHOLD_DURATION){
		this._isDragging = true;	
	}
	e.preventDefault();//return false;
	
};

TouchScrollPanel.prototype.onUpWindowHandler = function(e){
	console.log('onUpWindowHandler');
	var pageX;
	var pageY;
	var eventType = (e.type.indexOf('touch')!=-1)?'touch':'mouse';
	if(eventType==='touch'){
		//addEvent(window,'touchmove',this.onMoveWindowHandler.context(this));
		//addEvent(window,'touchend',this.onUpWindowHandler.context(this));
		$(window).unbind('touchmove',this.onMoveWindowHandler.rEvtContext(this));
		$(window).unbind('touchend',this.onUpWindowHandler.rEvtContext(this));
		pageX =  this._lastX; //use lastX and lasyY as e.targetTouches.length should === 0
		pageY =  this._lastY; 
	}else{
		$(document).unbind('mousemove',this.onMoveWindowHandler.rEvtContext(this));
		$(document).unbind('mouseup',this.onUpWindowHandler.rEvtContext(this));
		pageX = e.pageX;
		pageY = e.pageY; 
	}
	this._isDragging = false;
	
	var distanceMoved = Point.distance(new Point(pageX, pageY), new Point(this._originX, this._originY));			//check distance moved since mouse down
	var downTimeDuration = new Date().getTime() - this._downStartTime;													//check duration of mousedown and mouseup
	console.log("downTimeDuration:"+downTimeDuration);
	this._lastX = pageX;																						//record the x and y so we can use the coords in single click, and dragEnd
	this._lastY = pageY;
	//console.log('distanceMoved:'+distanceMoved);
	//console.log('downTimeDuration:'+downTimeDuration);
	if(distanceMoved < TouchScrollPanel.CLICK_THRESHOLD_DISTANCE && downTimeDuration < TouchScrollPanel.CLICK_THRESHOLD_DURATION){
		//click ok
		//console.log('go click');
	}else{
		//stop click
		//console.log('stop click');
		this._isStopChildMouseUp = true;
		setTimeout(this.releaseStopChildMouseUpTrap.context(this),33);//only release the trap ofter a frame, this is to ensure that we block all 
		var outside = this.checkScrollBoundry();
		var delta = 0;
		if(outside === false){
			if(this._scrollDirection === TouchScrollPanel.SCROLL_DIRECTION_VERTICAL){
				delta = this._topDelta;
			}else{
				delta = this._leftDelta;
			}
		}
		this.initInertiaAnimation(delta);
	}
	
	this._fadeThumbTimeout = setTimeout(this.onFadeOutThumb.context(this),1000);
	
	return false;
};

TouchScrollPanel.prototype.initInertiaAnimation = function(finalTopDelta){
	this._inertia = finalTopDelta;
	if(this._scrollDirection === TouchScrollPanel.SCROLL_DIRECTION_VERTICAL){
		this._contentDimension = $(this._contentElement).height();
	}else{
		this._contentDimension = $(this._contentElement).width();
	}
	this._inertiaInterval = setInterval(this.updateInertiaAnimation.context(this),33);
	this._isAnimating = true;
};

TouchScrollPanel.prototype.updateInertiaAnimation = function(){
	//Globals.log("updateInertiaAnimation");
	if(this._isAnimating===false)return;
	
	var containerPosition;
	var containerBottom;
	var frameDimension;
	var boundryModifier;
	var ammountIntoBoundry;
	var acceleration;
	var destination;
	var boundryDivider = 5;
	var velocity;
	
	if(this._scrollDirection === TouchScrollPanel.SCROLL_DIRECTION_VERTICAL){
		containerPosition = this._y;
		frameDimension = this._frameElement.clientHeight;
	}else{
		containerPosition = this._x;
		frameDimension = this._frameElement.clientWidth;
	}
	
	boundryModifier = 0;
	if(containerPosition > 0){
		containerBottom = containerPosition + this._contentDimension;
		ammountIntoBoundry = Math.abs(this._contentDimension - containerBottom);
		boundryModifier = -(ammountIntoBoundry / boundryDivider);
		if(this._inertia > 0){
			this._inertia = (this._inertia + boundryModifier) * this._friction;
			velocity = this._inertia;
		}else{
			this._inertia = 0;
			velocity = boundryModifier * this._friction
		}
	}else if(containerPosition < (frameDimension - this._contentDimension)) {
		ammountIntoBoundry = Math.abs((frameDimension - this._contentDimension) - containerPosition);
		boundryModifier = (ammountIntoBoundry / boundryDivider);
		if(this._inertia < 0){
			this._inertia = (this._inertia + boundryModifier) * this._friction;
			velocity = this._inertia;
		}else{
			this._inertia = 0;
			velocity = boundryModifier * this._friction
		}
	}else{
		this._inertia = this._inertia * this._friction;
		velocity = this._inertia;
	}

	this.setScrollPosition(containerPosition + velocity);
	if((velocity < 0.05 && velocity > -0.05) && (boundryModifier < 0.05 && boundryModifier > -0.05)){
		this.stopTweenAnimation();
	}
}

TouchScrollPanel.prototype.degreesToRadians = function(d){
	return (Math.PI/180) * d;
}

TouchScrollPanel.prototype.getAnimaitonProperties = function(delta){
	var frameCount = 0;
	var distance = 0;
	while(delta > 0.5 || delta < -0.5){
		delta *= 0.9;
		distance += delta;
		frameCount++;
	}
	var fps = 30;
	var milliseconds = (1000/fps); 
	var time = (1 / milliseconds) * frameCount;
	return {time:time, distance:distance};
};

TouchScrollPanel.prototype.onTweenUpdate = function(){
	if(this._scrollDirection === TouchScrollPanel.SCROLL_DIRECTION_VERTICAL){
		this.setScrollY(this.__tempZ);
	}else{
		this.setScrollX(this.__tempZ);
	}
};

TouchScrollPanel.prototype.onTweenComplete = function(){
	this.stopTweenAnimation();
	this.checkScrollBoundry();
};

TouchScrollPanel.prototype.stopTweenAnimation = function(){
	if(this._isAnimating === true){
		Globals.log("stopTweenAnimation");
		//Animator.removeTween(this);
		clearInterval(this._inertiaInterval);
		this._isAnimating = false;
	}
};


//---------------



TouchScrollPanel.prototype.onFadeOutThumb = function(){
//	this._isThumbVisible = false;
	//jTweener.removeTween(this._thumbElement);
	//jTweener.addTween(this._thumbElement,{opacity:0,time:3});
};

TouchScrollPanel.prototype.onFadeInThumb = function(){
	this._isThumbVisible = true;
	//clearTimeout(this._fadeThumbTimeout);
	//jTweener.removeTween(this._thumbElement);
	//jTweener.addTween(this._thumbElement,{opacity:1,time:1});
};

TouchScrollPanel.prototype.releaseStopChildMouseUpTrap = function(){
	console.log('releaseStopChildMouseUpTrap');
	this._isStopChildMouseUp = false;
};

TouchScrollPanel.prototype.scrollY = function(delta,constrainToFrame){
//	console.log('delta:'+delta);
	//var y = this._y;
	var y = this._y;
	var container = this._contentElement;
	//var contentHeight = $(this._contentElement).offset().height;
	var contentHeight = $(this._contentElement).height();
	var frameHeight = this._frameElement.clientHeight;
	var maxScrollDistance = contentHeight - frameHeight;

	var bottom = 0;
	var top = maxScrollDistance * -1
	
	
	var destinationY = y + delta;
	if(destinationY <= bottom &&  destinationY >= top){				// within normal boundry
		//destination is cool
	//}else if(destinationY >= lowerLimit){							//beyond lower boundry
		//destinationY = lowerLimit;
	//}else if(destinationY <= upperLimit){							//beyong upper boundry
		//destinationY = upperLimit;	
	}else if(constrainToFrame){
		destinationY = y;
	}else if(destinationY > bottom){	//within lower boundry			
		destinationY = y + (delta/4);
	}else if(destinationY < top){		//within upper boundry
		destinationY = y + (delta/4);
	}
	
	this._y = destinationY;
	
	this.updateDomScrollPosition();
};

TouchScrollPanel.prototype.scrollX = function(delta,constrainToFrame){
//	console.log('delta:'+delta);
	//var y = this._y;
	var x = this._x;
	var container = this._contentElement;
	//var contentHeight = $(this._contentElement).offset().height;
	var contentWidth = $(this._contentElement).width();
	var frameWidth = this._frameElement.clientWidth;
	var maxScrollDistance = contentWidth - frameWidth;

	var right = 0;
	var left = maxScrollDistance * -1

		
	var destinationX = x + delta;
	if(destinationX <= right &&  destinationX >= left){				// within normal boundry
		//destination is cool
	//}else if(destinationX >= lowerLimit){							//beyond lower boundry
		//destinationX = lowerLimit;
	//}else if(destinationX <= upperLimit){							//beyong upper boundry
		//destinationX = upperLimit;	
	}else if(constrainToFrame){
		destinationX = x;
	}else if(destinationX > right){	//within lower boundry			
		destinationX = x + (delta/4);
	}else if(destinationX < left){		//within upper boundry
		destinationX = x + (delta/4);
	}
	
	this._x = destinationX;
	
	this.updateDomScrollPosition();
};

TouchScrollPanel.prototype.checkScrollBoundry = function(){
	if(this._scrollDirection === TouchScrollPanel.SCROLL_DIRECTION_VERTICAL){
		var y = this._y;
		var contentHeight = $(this._contentElement).height();
		var frameHeight = this._frameElement.clientHeight;
		var destination;
		if(y > 0){
			//jTweener.addTween(this,{_y:0,time:0.5,onUpdate:this.updateDomScrollPosition.context(this)});
			return true;
		}else if(y < -(contentHeight-frameHeight)){
			//jTweener.addTween(this,{_y:-(contentHeight-frameHeight),time:0.5,onUpdate:this.updateDomScrollPosition.context(this)});
			return true;
		}return false;
	}else{
		var x = this._x;
		var contentWidth = $(this._contentElement).width();
		var frameWidth = this._frameElement.clientWidth;
		var destination;
		if(x > 0){
			//jTweener.addTween(this,{_x:0,time:0.5,onUpdate:this.updateDomScrollPosition.context(this)});
			return true;
		}else if(x < -(contentWidth-frameWidth)){
			//jTweener.addTween(this,{_x:-(contentWidth-frameWidth),time:0.5,onUpdate:this.updateDomScrollPosition.context(this)});
			return true;
		}return false;
	}
};

TouchScrollPanel.prototype.updateDomScrollPosition = function(){
	if(this._scrollDirection === TouchScrollPanel.SCROLL_DIRECTION_VERTICAL){
		this._contentElement.style.top = this._y+"px";
	}else{
		this._contentElement.style.left = this._x+"px";
	}
	this.drawThumb();
};

TouchScrollPanel.prototype.drawThumb = function(){
	var containerPosition;
	var thumbDimension;
	var frameWidth = this._frameElement.clientWidth;
	if(this._scrollDirection === TouchScrollPanel.SCROLL_DIRECTION_VERTICAL){
		containerPosition = this._y;
	}else{
		containerPosition = this._x;
	}

	var visiblePercentage = this._frameDimension / this._containerDimension;
	thumbDimension = this._frameDimension * visiblePercentage;
	
	if(this._containerDimension <= this._frameDimension){
		this._thumbElement.style.display = 'none';
		return;
	}else{
		this._thumbElement.style.display = 'block';
	}

	var maxScrollDistance = this._containerDimension - this._frameDimension;
	var destinationScrollPercentage = containerPosition / maxScrollDistance;
	var frameToContentDimensionRatio = this._frameDimension / this._containerDimension;
	var scrollThumbMaxTrackLength = (1 - frameToContentDimensionRatio) * this._frameDimension;
	var scrollThumbDestination = (destinationScrollPercentage * scrollThumbMaxTrackLength) * -1;
		
	var distanceOutside;
	if(containerPosition > 0 ){
		distanceOutside = containerPosition;
		thumbDimension = thumbDimension - distanceOutside;
		thumbDimension = Math.max(thumbDimension,14);
		scrollThumbDestination = 0;
	}else if((containerPosition + this._containerDimension) < this._frameDimension){
		distanceOutside = this._frameDimension - (containerPosition + this._containerDimension);
		thumbDimension = thumbDimension - distanceOutside;
		thumbDimension = Math.max(thumbDimension,14);
		scrollThumbDestination = this._frameDimension - thumbDimension;
	}

	if(this._thumbDimension !== thumbDimension){
		this._thumbDimension = thumbDimension;
		this._thumbElement.style[this._styleDimension] = this._thumbDimension+"px";
	}

	this._thumbElement.style[this._stylePosition] = scrollThumbDestination+"px";
};

TouchScrollPanel.prototype.onDOMMouseScrollHandler = function(e){
	//Globals.log('onDOMMouseScrollHandler');
    var delta = -e.detail;
	this.setMouseWheenDelta(delta);
};


TouchScrollPanel.prototype.onMouseWheelHandler = function(e){
	this.setMouseWheenDelta(e.wheelDelta);
	e.preventDefault();				//prevent lion browser from bounce scroll effect
};

TouchScrollPanel.prototype.setMouseWheenDelta = function(delta){
	//Globals.log('onMouseWheel:'+delta);
	if(this._isThumbVisible === false){
		this.onFadeInThumb();
	}else{
		this._fadeThumbTimeout = setTimeout(this.onFadeOutThumb.context(this),2000);
	}
	switch(this._scrollDirection){
		case TouchScrollPanel.SCROLL_DIRECTION_VERTICAL:
			this.scrollY(delta,true);
			break;
		case TouchScrollPanel.SCROLL_DIRECTION_HORIZONTAL:
			//this.scrollX(e.wheelDelta,true);
			this.scrollX(delta,true);
			break;
	}
}





//PUBLIC
//__________________________________________________________________________________________
TouchScrollPanel.prototype.clear  = function(){
	Globals.log("clear");
	jTweener.removeTween(this._thumbElement);
	this.stopTweenAnimation();
};

TouchScrollPanel.prototype.isStopChildMouseUp = function(){
	return 	this._isStopChildMouseUp;
};
TouchScrollPanel.prototype.isDragging = function(){
	return 	this._isDragging;
};

TouchScrollPanel.prototype.getScrollY = function(){
	return this._y;
}
TouchScrollPanel.prototype.setScrollY = function(y){
	this._y = y;
	this.updateDomScrollPosition();
};

TouchScrollPanel.prototype.getScrollX = function(){
	return this._x;
}
TouchScrollPanel.prototype.setScrollX = function(x){
	this._x = x;
	this.updateDomScrollPosition();
};
TouchScrollPanel.prototype.getScrollPosition = function(){
	if(this._scrollDirection === TouchScrollPanel.SCROLL_DIRECTION_VERTICAL){
		return this.getScrollY();
	}else{
		return this.getScrollX();
	}
}
TouchScrollPanel.prototype.setScrollPosition = function(d){
	if(this._scrollDirection === TouchScrollPanel.SCROLL_DIRECTION_VERTICAL){
		this.setScrollY(d);
	}else{
		this.setScrollX(d);
	}
}
/*
TouchScrollPanel.prototype.scrollToPos = function(){
	
};
*/
TouchScrollPanel.prototype.scrollToPreviousPage = function(){

};

TouchScrollPanel.prototype.scrollToNextPage = function(){
	
};


TouchScrollPanel.prototype.getScrollMinY = function(){
	return 0;
};
TouchScrollPanel.prototype.getScrollMinX = function(){
	return 0;
};

TouchScrollPanel.prototype.getFrameWidth = function(){
	return this._frameElement.clientWidth;
};

TouchScrollPanel.prototype.getFrameHeight = function(){
	return this._frameElement.clientHeight;
};

TouchScrollPanel.prototype.getContentDimension = function(){
	return this._contentDimension;
};




TouchScrollPanel.prototype.updateThumb = function(){
	if(this._scrollDirection === TouchScrollPanel.SCROLL_DIRECTION_VERTICAL){
		this._containerDimension = $(this._contentElement).height();
		this._frameDimension = this._frameElement.clientHeight;
		this._stylePosition = "top";
		this._styleDimension = "height";
	}else{
		this._containerDimension = $(this._contentElement).width();
		this._frameDimension = this._frameElement.clientWidth;
		this._stylePosition = "left";
		this._styleDimension = "width";
	}
	this.onFadeInThumb();
	this._fadeThumbTimeout = setTimeout(this.onFadeOutThumb.context(this),2000);
	this.drawThumb();
};