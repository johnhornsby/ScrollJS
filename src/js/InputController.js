// JavaScript Document
var InputController = function(interactiveElement){
	this._delegate;
	this._interactiveElement = interactiveElement;
	this._originX = 0;
	this._originY = 0;
	this._lastX = 0;
	this._lastY = 0;
	this._leftDelta = 0;
	this._topDelta = 0;
	this._downStartTime = 0;
	this._clickStartArray = [new Date().getTime()];//start this with a time so we don't have to check later for things.
	this._singleClickTimeout;
	this._mouseDown = false;
	this._click = false;
	//this._inertiaInterval;
	
	this.init();
}

InputController.MOUSE_DRAG_MODIFIER = 2;
InputController.CLICK_THRESHOLD_DURATION = 250 // milliseconds 500
InputController.DOUBLE_CLICK_THRESHOLD_DURATION = 250 // milliseconds 500
InputController.CLICK_THRESHOLD_DISTANCE = 10 // pixels



InputController.prototype.init = function(){
	
}

InputController.prototype.onMouseDown = function(e){
	//console.log("onMouseDown()");
	//this.stopInertia();
	//if(e.originalEvent)e = e.originalEvent;
	this._click = true;
	this._downStartTime = new Date().getTime();
	clearTimeout(this._singleClickTimeout);
	
	this._lastX = this._originX = e.pageX;
	this._lastY = this._originY = e.pageY;
	//this._interactiveElement.addEventListener('mousemove',this.onMouseMove.rEvtContext(this), false);
	//this._interactiveElement.addEventListener('mouseup',this.onMouseUp.rEvtContext(this), false);
	$(document).bind('mousemove',this.onMouseMove.rEvtContext(this));
	$(document).bind('mouseup',this.onMouseUp.rEvtContext(this));
	this._mouseDown = true;
	this._delegate.mouseDown(0,0,this._lastX,this._lastY);
	return false;
}
InputController.prototype.onMouseMove = function(e){
	//console.log("onMouseMove()");
	//if(e.originalEvent)e = e.originalEvent;
	if(this._mouseDown === true){
		this._leftDelta = e.pageX - this._lastX;
		this._topDelta = e.pageY - this._lastY;
		//this.appendPosition(this._leftDelta,this._topDelta);
		if(this._delegate.dragMove !== undefined)this._delegate.dragMove(this._leftDelta,this._topDelta,e.pageX,e.pageY);
		this._lastX = e.pageX;
		this._lastY = e.pageY;
		
	}
	return false;
}
InputController.prototype.onMouseUp = function(e){
	//Globals.log("onMouseUp()");
	//if(e.originalEvent)e = e.originalEvent;
	this._mouseDown=false;	
	//this._interactiveElement.removeEventListener('mousemove', this.onMouseMove.rEvtContext(this), false);
	//this._interactiveElement.removeEventListener('mouseup', this.onMouseUp.rEvtContext(this), false);
	$(document).unbind('mousemove',this.onMouseMove.rEvtContext(this));
	$(document).unbind('mouseup',this.onMouseUp.rEvtContext(this));
	
	
	//Check for click;
	var distanceMoved = Point.distance(new Point(e.pageX, e.pageY), new Point(this._originX, this._originY));			//check distance moved since mouse down
	var downTimeDuration = new Date().getTime() - this._downStartTime;													//check duration of mousedown and mouseup
	var timeElapsedSinceLastClick;
	this._lastX = e.pageX;																						//record the x and y so we can use the coords in single click, and dragEnd
	this._lastY = e.pageY;
	//Globals.log("this._click:"+this._click+"distanceMoved:"+distanceMoved+" downTimeDuration:"+downTimeDuration+" timeElapsedSinceLastClick:"+timeElapsedSinceLastClick);								
	if(this._click === true && distanceMoved < InputController.CLICK_THRESHOLD_DISTANCE && downTimeDuration < InputController.CLICK_THRESHOLD_DURATION){
		//console.log(this._downStartTime);
		this._clickStartArray.push(this._downStartTime);																//add time of start click to array
		timeElapsedSinceLastClick = this._downStartTime - this._clickStartArray[this._clickStartArray.length-2];		//duration between this click and last, from mousedown of first click to mousedown of second click
		
		if(timeElapsedSinceLastClick < InputController.DOUBLE_CLICK_THRESHOLD_DURATION){								//if double click duration is below doubleClickThreshold then create double click
			//Globals.log("Double Click");
			this.onDoubleClick(e.pageX,e.pageY);
		}else{
			
			this._singleClickTimeout = setTimeout(this.onSingleClick.context(this,e.pageX,e.pageY),InputController.DOUBLE_CLICK_THRESHOLD_DURATION);//use timeout on single click to allow for user to double click and overide single click action
		}
		return false;
	}
	
	//this._inertiaDeltaX = this._leftDelta;
	//this._inertiaDeltaY = this._topDelta;
	//this._inertiaInterval = setInterval(this.addInertia.context(this),33);
	this._delegate.dragEnd(this._leftDelta,this._topDelta,this._lastX,this._lastY);
	return false;
}
InputController.prototype.onSingleClick = function(x,y){
	this._delegate.singleClick(this._lastX,this._lastY);
}

InputController.prototype.onDoubleClick = function(x,y){
	this._delegate.doubleClick(this._lastX,this._lastY);
}


InputController.prototype.onTouchStart = function(e){
	//this.stopInertia();
	if(e.originalEvent)e = e.originalEvent;
	if (e.targetTouches.length != 1)
		return false;
	this._click = true;
	this._downStartTime = new Date().getTime();
	clearTimeout(this._singleClickTimeout);
	this._lastX = this._originX = e.targetTouches[0].clientX;
	this._lastY = this._originY = e.targetTouches[0].clientY;
	$(document).bind('touchmove',this.onTouchMove.rEvtContext(this));
	$(document).bind('touchend',this.onTouchEnd.rEvtContext(this));
	this._delegate.mouseDown(0,0,this._lastX,this._lastY);
	return false;
}

InputController.prototype.onTouchMove = function(e){
	e.preventDefault();
	if(e.originalEvent)e = e.originalEvent;
	// Don't track motion when multiple touches are down in this element (that's a gesture)
	if (e.targetTouches.length != 1)
		return false;
	this._leftDelta = e.targetTouches[0].clientX - this._lastX;
	this._topDelta = e.targetTouches[0].clientY - this._lastY;
	//this.appendPosition(this._leftDelta,this._topDelta);
	if(this._delegate.dragMove !== undefined)this._delegate.dragMove(this._leftDelta,this._topDelta,e.targetTouches[0].clientX,e.targetTouches[0].clientY);
	this._lastX = e.targetTouches[0].clientX;
	this._lastY = e.targetTouches[0].clientY;
	//this._delegate.update();
	return false;
}

InputController.prototype.onTouchEnd = function(e){
	// Prevent the browser from doing its default thing (scroll, zoom)
	if(e.originalEvent)e = e.originalEvent;
	e.preventDefault();
	// Stop tracking when the last finger is removed from this element
	if (e.targetTouches.length > 0)
		return false;
	$(document).unbind('touchmove',this.onTouchMove.rEvtContext(this));
	$(document).unbind('touchend',this.onTouchEnd.rEvtContext(this));
	
	//Check for click;
	var distanceMoved = Point.distance(new Point(this._lastX, this._lastY), new Point(this._originX, this._originY));
	var downTimeDuration = new Date().getTime() - this._downStartTime;
	if(this._click === true && distanceMoved < InputController.CLICK_THRESHOLD_DISTANCE && downTimeDuration < InputController.CLICK_THRESHOLD_DURATION){
		this._clickStartArray.push(this._downStartTime);
		timeElapsedSinceLastClick = this._downStartTime - this._clickStartArray[this._clickStartArray.length-2];
		if(timeElapsedSinceLastClick < InputController.DOUBLE_CLICK_THRESHOLD_DURATION){
			this.onDoubleClick(this._lastX, this._lastY);
		}else{
			this._singleClickTimeout = setTimeout(this.onSingleClick.context(this,e.pageX,e.pageY),InputController.DOUBLE_CLICK_THRESHOLD_DURATION);
		}
		return false;
	}
	this._delegate.dragEnd(this._leftDelta,this._topDelta,this._lastX,this._lastY);
	return false;
}

InputController.prototype.onDOMMouseScrollHandler = function(e){
	if(e.originalEvent)e = e.originalEvent;
	var deltaX = 0;
	var deltaY = -e.detail * 3;
	this.setMouseWheenDelta(deltaX,deltaY);
};


InputController.prototype.onMouseWheelHandler = function(e){
	var $event = e;
	if(e.originalEvent)e = e.originalEvent;
	var deltaX = 0;
	var deltaY = e.wheelDelta;
	if(e.wheelDeltaX || e.wheelDeltaY){
		deltaX = e.wheelDeltaX;
		deltaY = e.wheelDeltaY;
	}
	this.setMouseWheenDelta(deltaX,deltaY);
	$event.preventDefault();				//prevent lion browser from bounce scroll effect
};

InputController.prototype.setMouseWheenDelta = function(deltaX,deltaY){
	this._delegate.setMouseWheelScrollDelta(deltaX,deltaY);
}

//PUBLIC
//________________________________________________________________________________________________________________________
InputController.prototype.setDelegate = function(delegate){
	this._delegate = delegate;
};

InputController.prototype.activate = function(){
	$(this._interactiveElement).bind('mousewheel',this.onMouseWheelHandler.context(this));
	$(this._interactiveElement).bind('DOMMouseScroll',this.onDOMMouseScrollHandler.context(this));
	$(this._interactiveElement).bind('mousedown', this.onMouseDown.rEvtContext(this));
	$(this._interactiveElement).bind('touchstart', this.onTouchStart.rEvtContext(this));
};

InputController.prototype.deactivate = function(){
	//this._interactiveElement.removeEventListener('mousedown', this.onMouseDown.rEvtContext(this), false);
	//this._interactiveElement.removeEventListener('touchstart', this.onTouchStart.rEvtContext(this), false);
	$(this._interactiveElement).unbind('mousewheel',this.onMouseWheelHandler.context(this));
	$(this._interactiveElement).unbind('DOMMouseScroll',this.onDOMMouseScrollHandler.context(this));
	$(this._interactiveElement).unbind('mousedown', this.onMouseDown.rEvtContext(this));
	$(this._interactiveElement).unbind('touchstart', this.onTouchStart.rEvtContext(this));
};