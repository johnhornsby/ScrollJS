var ScrollPanelController = function(options){
	EventDispatcher.call(this);
	if(options === undefined) return;				// inheritance handling
	
	this._frameElement = options.frameElement;
	this._contentElement = options.contentElement;
	this._scrollDirection = options.scrollDirection || ScrollPanelController.SCROLL_DIRECTION_VERTICAL;
	
	this._inputController;
	
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
	
	this.init();
};
//inheritance
ScrollPanelController.prototype = new EventDispatcher();
ScrollPanelController.prototype.constructor = ScrollPanelController;
ScrollPanelController.prototype.supr = EventDispatcher.prototype;

ScrollPanelController.SCROLL_DIRECTION_VERTICAL = 0;
ScrollPanelController.SCROLL_DIRECTION_HORIZONTAL = 1;
ScrollPanelController.MOUSE_DRAG_MODIFIER = 2;
ScrollPanelController.CLICK_THRESHOLD_DURATION = 500 // milliseconds 500
ScrollPanelController.CLICK_THRESHOLD_DISTANCE = 10 // pixels






//PRIVATE
//__________________________________________________________________________________________
ScrollPanelController.prototype.init = function(){
	this._inputController = new InputController($('#frame').get(0));
	this._inputController.setDelegate(this);
	this._inputController.activate();
	
};

ScrollPanelController.prototype.doubleClick = function(x,y){
	//this.output("doubleClick x:"+x+" y:"+y);
};
		
ScrollPanelController.prototype.singleClick = function(x,y){
	//this.output("singleClick x:"+x+" y:"+y);
};

ScrollPanelController.prototype.mouseDown = function(deltaX,deltaY,x,y) {
	//this.output("mouseDown dx:"+deltaX+" dy:"+deltaY);
	this.stopTweenAnimation();
};

ScrollPanelController.prototype.setScrollDelta = function(deltaX,deltaY,x,y){
	//this.output("setScrollDelta dx:"+deltaX+" dy:"+deltaY+" x:"+x+" y:"+y);
	switch(this._scrollDirection){
		case ScrollPanelController.SCROLL_DIRECTION_VERTICAL:
			this.scrollY(deltaY,false);
			break;
		case ScrollPanelController.SCROLL_DIRECTION_HORIZONTAL:
			this.scrollX(deltaX,false);
			break;
	}
	this._isDragging = true;
};

ScrollPanelController.prototype.dragEnd = function(deltaX,deltaY,x,y){
	//this.output("dragEnd dx:"+deltaX+" dy:"+deltaY+" x:"+x+" y:"+y);
	this._isDragging = false;
	this._isStopChildMouseUp = true;
	setTimeout(this.releaseStopChildMouseUpTrap.context(this),33);//only release the trap ofter a frame, this is to ensure that we block all 
	var outside = this.checkScrollBoundry();
	var delta = 0;
	if(outside === false){
		if(this._scrollDirection === ScrollPanelController.SCROLL_DIRECTION_VERTICAL){
			delta = deltaY;
		}else{
			delta = deltaX;
		}
	}
	this.initInertiaAnimation(delta);
};

ScrollPanelController.prototype.setMouseWheelScrollDelta = function(deltaX,deltaY){
	//this.output("setMouseWheelScrollDelta dx:"+deltaX+" dy:"+deltaY);
	switch(this._scrollDirection){
		case ScrollPanelController.SCROLL_DIRECTION_VERTICAL:
			this.scrollY(deltaY,true);
			break;
		case ScrollPanelController.SCROLL_DIRECTION_HORIZONTAL:
			this.scrollX(deltaY,true);
			break;
	}
};





ScrollPanelController.prototype.initInertiaAnimation = function(finalTopDelta){
	this._inertia = finalTopDelta;
	if(this._scrollDirection === ScrollPanelController.SCROLL_DIRECTION_VERTICAL){
		this._contentDimension = $(this._contentElement).height();
	}else{
		this._contentDimension = $(this._contentElement).width();
	}
	this._inertiaInterval = setInterval(this.updateInertiaAnimation.context(this),33);
	this._isAnimating = true;
};

ScrollPanelController.prototype.updateInertiaAnimation = function(){
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
	
	if(this._scrollDirection === ScrollPanelController.SCROLL_DIRECTION_VERTICAL){
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

ScrollPanelController.prototype.stopTweenAnimation = function(){
	if(this._isAnimating === true){
		//Globals.log("stopTweenAnimation");
		//Animator.removeTween(this);
		clearInterval(this._inertiaInterval);
		this._isAnimating = false;
	}
};


//---------------

ScrollPanelController.prototype.releaseStopChildMouseUpTrap = function(){
	console.log('releaseStopChildMouseUpTrap');
	this._isStopChildMouseUp = false;
};

ScrollPanelController.prototype.scrollY = function(delta,constrainToFrame){
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

ScrollPanelController.prototype.scrollX = function(delta,constrainToFrame){
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

ScrollPanelController.prototype.checkScrollBoundry = function(){
	if(this._scrollDirection === ScrollPanelController.SCROLL_DIRECTION_VERTICAL){
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

ScrollPanelController.prototype.updateDomScrollPosition = function(){
	if(this._scrollDirection === ScrollPanelController.SCROLL_DIRECTION_VERTICAL){
		this._contentElement.style.top = this._y+"px";
	}else{
		this._contentElement.style.left = this._x+"px";
	}
};





//PUBLIC
//__________________________________________________________________________________________
ScrollPanelController.prototype.clear  = function(){
	//Globals.log("clear");
	
	this.stopTweenAnimation();
};

ScrollPanelController.prototype.isStopChildMouseUp = function(){
	return 	this._isStopChildMouseUp;
};
ScrollPanelController.prototype.isDragging = function(){
	return 	this._isDragging;
};

ScrollPanelController.prototype.getScrollY = function(){
	return this._y;
}
ScrollPanelController.prototype.setScrollY = function(y){
	this._y = y;
	this.updateDomScrollPosition();
};

ScrollPanelController.prototype.getScrollX = function(){
	return this._x;
}
ScrollPanelController.prototype.setScrollX = function(x){
	this._x = x;
	this.updateDomScrollPosition();
};
ScrollPanelController.prototype.getScrollPosition = function(){
	if(this._scrollDirection === ScrollPanelController.SCROLL_DIRECTION_VERTICAL){
		return this.getScrollY();
	}else{
		return this.getScrollX();
	}
}
ScrollPanelController.prototype.setScrollPosition = function(d){
	if(this._scrollDirection === ScrollPanelController.SCROLL_DIRECTION_VERTICAL){
		this.setScrollY(d);
	}else{
		this.setScrollX(d);
	}
}
/*
ScrollPanelController.prototype.scrollToPos = function(){
	
};
*/
ScrollPanelController.prototype.scrollToPreviousPage = function(){

};

ScrollPanelController.prototype.scrollToNextPage = function(){
	
};


ScrollPanelController.prototype.getScrollMinY = function(){
	return 0;
};
ScrollPanelController.prototype.getScrollMinX = function(){
	return 0;
};

ScrollPanelController.prototype.getFrameWidth = function(){
	return this._frameElement.clientWidth;
};

ScrollPanelController.prototype.getFrameHeight = function(){
	return this._frameElement.clientHeight;
};

ScrollPanelController.prototype.getContentDimension = function(){
	return this._contentDimension;
};