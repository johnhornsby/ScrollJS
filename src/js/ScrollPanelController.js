var ScrollPanelController = function(options){
	EventDispatcher.call(this);
	if(options === undefined) return;				// inheritance handling
	
	this._frameElement = options.frameElement;		//passed to InputController
	this._scrollDirection = options.scrollDirection || ScrollPanelController.SCROLL_DIRECTION_VERTICAL;
	this._contentHeight = options.contentHeight || 0;
	this._contentWidth = options.contentWidth || 0;
	this._frameHeight = options.frameHeight || 0;
	this._frameWidth = options.frameWidth || 0;
	this._shouldBounce = options.bounce || false;
	this._shouldSnap = options.snap || false;
	this._snapHeight = options.snapHeight || 0;
	this._snapWidth = options.snapWidth || 0;
	this._inputMultiplier = options.inputMultiplier || 1;
	this._wrap = options.wrap || false;
	this._maxScrollDistanceX = this._contentWidth - this._frameWidth;
	this._maxScrollDistanceY = this._contentHeight - this._frameHeight;
	
	this._tweenX;
	this._tweenY;
	
	this._isDragging = false;
	this._isStopChildMouseUp = false;
	this._isAnimating = false;
	this._inertiaInterval = undefined;
	this._y = 0;
	this._x = 0;
	this._friction = options.friction || 0.9;
	this._inertiaX = 0;
	this._inertiaY = 0;
	
	this._delegate;
	this._scrollDelegate;
	this._inputController;
	
	this._init();
};
//inheritance
ScrollPanelController.prototype = new EventDispatcher();
ScrollPanelController.prototype.constructor = ScrollPanelController;
ScrollPanelController.prototype.supr = EventDispatcher.prototype;

ScrollPanelController.SCROLL_DIRECTION_VERTICAL = 0;
ScrollPanelController.SCROLL_DIRECTION_HORIZONTAL = 1;
ScrollPanelController.SCROLL_DIRECTION_BOTH = 2;
ScrollPanelController.MOUSE_DRAG_MODIFIER = 2;
ScrollPanelController.CLICK_THRESHOLD_DURATION = 500 // milliseconds 500
ScrollPanelController.CLICK_THRESHOLD_DISTANCE = 10 // pixels








//PRIVATE
//__________________________________________________________________________________________
ScrollPanelController.prototype._init = function(){
	
	if(this._wrap === true){
		this._shouldBounce = true;
	}
	
	this._inputController = new InputController(this._frameElement);
	this._inputController.setDelegate(this);
	this._inputController.activate();
	
};

ScrollPanelController.prototype._initInertiaAnimation = function(finalLeftDelta, finalTopDelta){
	this._inertiaX = finalLeftDelta;
	this._inertiaY = finalTopDelta;
	
	if(this._shouldSnap === true){
		//here we need to predict the final position, then animate to that position manually
		var predictedInertiaAnimationData = this._predictCompletedInertiaAnimation(this._x, this._y, this._inertiaX, this._inertiaY);
		var snappedToAnimationData = this._determinSnapedToDestination(predictedInertiaAnimationData);
		this._tweenX = this._x;
		this._tweenY = this._y;
		Animator.addTween(this,{time:1,_tweenX:snappedToAnimationData.x,_tweenY:predictedInertiaAnimationData.y,onUpdate:this._tweenUpdate.context(this),onComplete:this._tweenComplete.context(this)})
	}else {
		this._inertiaInterval = setInterval(this._updateInertiaAnimation.context(this),33);
	}
	this._isAnimating = true;
};

ScrollPanelController.prototype._tweenUpdate = function(){
	console.log(this._tweenX);
	this._setScrollPosition(this._tweenX,this._tweenY);
}

ScrollPanelController.prototype._tweenComplete = function(){
	this._isAnimating = false;
}


ScrollPanelController.prototype._determinSnapedToDestination = function(inertiaAnimationData){
	var maxScrollDistanceX = this._maxScrollDistanceX * -1;
	var a = inertiaAnimationData.x / -960;
	var b = Math.round(a);
	var c = b * -960;
	inertiaAnimationData.x = c;
	return inertiaAnimationData;
}

ScrollPanelController.prototype._predictCompletedInertiaAnimation = function(x, y, xInertia, yInertia){
	var d; //inertiaAnimationData
	var shouldAnimate = true;
	var emergencyEscapeLoops = 100;
	while(shouldAnimate === true && emergencyEscapeLoops !== 0){
		d = this._calculateInertiaAnimation(x, y, xInertia, yInertia);
		//need to retain the inertia values to use again for next update of the inertia
		x = d.x;
		y = d.y;
		xInertia = d.xInertia;//set inertia back into property, bit of a workaround for using a method for both dimensions
		yInertia = d.yInertia;//set inertia back into property, bit of a workaround for using a method for both dimensions
		//console.log("x="+d.x+" y:"+d.y+" xInertia:"+d.xInertia+" yInertia:"+d.yInertia);
		if((d.xVelocity < 0.05 && d.xVelocity > -0.05) && (d.xBoundryModifier < 0.05 && d.xBoundryModifier > -0.05) && (d.yVelocity < 0.05 && d.yVelocity > -0.05) && (d.yBoundryModifier < 0.05 && d.yBoundryModifier > -0.05)){
			shouldAnimate = false;
			//console.log("completed x:"+d.x+" completed y:"+d.y);
		}
		if(emergencyEscapeLoops===0){
			shouldAnimate = false;
			console.log("HELP emergencyEscapeLoops===0");
		}
		emergencyEscapeLoops--;
	}
	return d;
}

ScrollPanelController.prototype._updateInertiaAnimation = function(){
	//Globals.log("_updateInertiaAnimation");
	if(this._isAnimating===false)return;

	var d = this._calculateInertiaAnimation(this._x, this._y, this._inertiaX, this._inertiaY); //inertiaAnimationData
	//need to retain the inertia values to use again for next update of the inertia
	this._inertiaX = d.xInertia;//set inertia back into property, bit of a workaround for using a method for both dimensions
	this._inertiaY = d.yInertia;//set inertia back into property, bit of a workaround for using a method for both dimensions
	//console.log("x="+d.x+" y:"+d.y+" xInertia:"+d.xInertia+" yInertia:"+d.yInertia);
	this._setScrollPosition(d.x, d.y);

	if((d.xVelocity < 0.05 && d.xVelocity > -0.05) && (d.xBoundryModifier < 0.05 && d.xBoundryModifier > -0.05) && (d.yVelocity < 0.05 && d.yVelocity > -0.05) && (d.yBoundryModifier < 0.05 && d.yBoundryModifier > -0.05)){
		this._stopTweenAnimation();
		console.log("really completed x:"+d.x+" really completed y:"+d.y);
	}
}

ScrollPanelController.prototype._calculateInertiaAnimation = function(x, y, xInertia, yInertia){
	var xInertiaProperties = this._performDimensionalInertiaCalculations(this._maxScrollDistanceX, x, xInertia);
	xInertia = xInertiaProperties.inertia;	//set inertia back into property, bit of a workaround for using a method for both dimensions
	var yInertiaProperties = this._performDimensionalInertiaCalculations(this._maxScrollDistanceY, y, yInertia);
	yInertia = yInertiaProperties.inertia;	//set inertia back into property, bit of a workaround for using a method for both dimensions
	x = this._resolveScrollDelta(xInertiaProperties.velocity,!this._shouldBounce, false, x, "_inertiaX", this._maxScrollDistanceX);
	y = this._resolveScrollDelta(yInertiaProperties.velocity,!this._shouldBounce, false, y, "_inertiaY", this._maxScrollDistanceY);
	return {x:x, y:y, xInertia:xInertia, yInertia:yInertia, xVelocity:xInertiaProperties.velocity, yVelocity:yInertiaProperties.velocity, xBoundryModifier:xInertiaProperties.boundryModifier, yBoundryModifier:yInertiaProperties.boundryModifier};
}

/**
	return data used for delta due to previous interia value
**/
ScrollPanelController.prototype._performDimensionalInertiaCalculations = function(maxScrollDistance, containerPosition, inertia){
	var boundryModifier = 0;
	var ammountIntoBoundry = 0;
	var boundryDivider = 5;
	var velocity = 0;
	if(containerPosition > 0 && this._shouldBounce){
		boundryModifier = -(containerPosition / boundryDivider);
		if(inertia > 0){
			inertia = (inertia + boundryModifier) * this._friction;
			velocity = inertia;
		}else{
			inertia = 0;
			velocity = boundryModifier * this._friction
		}
	}else if(containerPosition < -maxScrollDistance && this._shouldBounce) {	
		ammountIntoBoundry = Math.abs(-maxScrollDistance - containerPosition);
		boundryModifier = (ammountIntoBoundry / boundryDivider);
		if(inertia < 0){
			inertia = (inertia + boundryModifier) * this._friction;
			velocity = inertia;
		}else{
			inertia = 0;
			velocity = boundryModifier * this._friction
		}
	}else{
		inertia = inertia * this._friction;
		velocity = inertia;
	}
	return {velocity:velocity, boundryModifier:boundryModifier, inertia:inertia};
}



ScrollPanelController.prototype._stopTweenAnimation = function(){
	if(this._isAnimating === true){
		//Globals.log("_stopTweenAnimation");
		//Animator.removeTween(this);
		clearInterval(this._inertiaInterval);
		this._isAnimating = false;
	}
};


//---------------

ScrollPanelController.prototype._releaseStopChildMouseUpTrap = function(){
	console.log('_releaseStopChildMouseUpTrap');
	this._isStopChildMouseUp = false;
};

ScrollPanelController.prototype._resolveScrollDeltaY = function(delta,constrainToFrame, applyDrag){
	return this._resolveScrollDelta(delta,constrainToFrame, applyDrag, this._y, "_inertiaY", this._maxScrollDistanceY);
};

ScrollPanelController.prototype._resolveScrollDeltaX = function(delta,constrainToFrame, applyDrag){
	return this._resolveScrollDelta(delta,constrainToFrame, applyDrag, this._x, "_inertiaX", this._maxScrollDistanceX);
};

/**
 return final position from passed in delta, this can be modified and corrected due to wrapping and constaint to frame and being outside of boundry
**/
ScrollPanelController.prototype._resolveScrollDelta = function(delta, constrainToFrame, applyDrag, position, inertiaPropertyName, maxScrollDistance){
	var x = position;
	var right = 0;
	var left = maxScrollDistance * -1
	var destinationX = x + delta;
	var drag = 4;
	if(applyDrag === false) drag = 1;
	if(destinationX <= right &&  destinationX >= left){				// within normal boundry
	
	}else if(destinationX > right){	//within lower boundry	
		if(constrainToFrame){
			destinationX = right;
			this[inertiaPropertyName] = 0;
		}else{
			if(this._wrap === true){
				destinationX = left + destinationX;
			}else{
				destinationX = x + (delta/drag);
			}
		}
	}else if(destinationX < left){		//within upper boundry
		if(constrainToFrame){
			destinationX = left;
			this[inertiaPropertyName] = 0;
		}else{
			if(this._wrap === true){
				destinationX = right + (destinationX - left);
			}else{
				destinationX = x + (delta/drag);
			}
		}
	}
	return destinationX;
}

ScrollPanelController.prototype._checkScrollBoundry = function(){
	if(this._y > 0){
		return true;
	}else if(this._y < - this._maxScrollDistanceX){
		return true;
	}
	if(this._x > 0){
		return true;
	}else if(this._x < - this._maxScrollDistanceX){
		return true;
	}
	return false;
};

ScrollPanelController.prototype._updateDomScrollPosition = function(){
	if(this._delegate.updatePosition !== undefined){
		this._delegate.updatePosition(this._x,this._y);
	}
	/*
	if(this._scrollDelegate.drawHorizontalThumb !== undefined){
		var scrollProperties = this._getScrollProperties(this._contentWidth, this._frameWidth, this._x);
		this._scrollDelegate.drawHorizontalThumb(scrollProperties.position, scrollProperties.dimension);
	}
	if(this._scrollDelegate.drawVerticleThumb !== undefined){
		var scrollProperties = this._getScrollProperties(this._contentHeight, this._frameHeight, this._y);
		this._scrollDelegate.drawVerticleThumb(scrollProperties.position, scrollProperties.dimension);
	}
	*/
};

ScrollPanelController.prototype._setX = function(x){
	if(this._scrollDirection !== ScrollPanelController.SCROLL_DIRECTION_VERTICAL)this._x = x;
};

ScrollPanelController.prototype._setY = function(y){
	if(this._scrollDirection !== ScrollPanelController.SCROLL_DIRECTION_HORIZONTAL)this._y = y;
};

ScrollPanelController.prototype._setScrollPosition = function(x,y){
	this._setX(x);
	this._setY(y);
	this._updateDomScrollPosition();	
}
/*
ScrollPanelController.prototype._drawThumb = function(){
	var containerPosition;
	var thumbDimension;
	var frameWidth = this._frameElement.clientWidth;
	if(this._scrollDirection === ThumbController.SCROLL_DIRECTION_VERTICAL){
		containerPosition = this._y;
	}else{
		containerPosition = this._x;
	}

	var frameDimension = this._frameWidth;
	
	

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
*/



//INPUT CONTROLLER DELEGATE METHODS
//__________________________________________________________________________________________
ScrollPanelController.prototype.doubleClick = function(x,y){
	//this.output("doubleClick x:"+x+" y:"+y);
};
		
ScrollPanelController.prototype.singleClick = function(x,y){
	//this.output("singleClick x:"+x+" y:"+y);
};

ScrollPanelController.prototype.mouseDown = function(deltaX,deltaY,x,y) {
	//this.output("mouseDown dx:"+deltaX+" dy:"+deltaY);
	this._stopTweenAnimation();
	Animator.removeTween(this);
};

ScrollPanelController.prototype.dragMove = function(deltaX,deltaY,x,y){
	var x = this._resolveScrollDeltaX(deltaX * this._inputMultiplier,!this._shouldBounce, true);
	var y = this._resolveScrollDeltaY(deltaY * this._inputMultiplier,!this._shouldBounce, true);
	this._setScrollPosition(x, y);
	this._updateDomScrollPosition();
	this._isDragging = true;
};

ScrollPanelController.prototype.dragEnd = function(deltaX,deltaY,x,y){
	//this.output("dragEnd dx:"+deltaX+" dy:"+deltaY+" x:"+x+" y:"+y);
	this._isDragging = false;
	this._isStopChildMouseUp = true;
	setTimeout(this._releaseStopChildMouseUpTrap.context(this),33);//only release the trap ofter a frame, this is to ensure that we block all
	
	var outside = this._checkScrollBoundry();
	var dx = 0;
	var dy = 0;
	if(outside === false){
		dx = deltaX * this._inputMultiplier;
		dy = deltaY * this._inputMultiplier;
	}
	this._initInertiaAnimation(dx,dy);
};

ScrollPanelController.prototype.setMouseWheelScrollDelta = function(deltaX,deltaY){
	if(this._scrollDirection === ScrollPanelController.SCROLL_DIRECTION_HORIZONTAL){
		deltaX = deltaY;	//use deltaY as this is what users expect
	}

	var x = this._resolveScrollDeltaX(deltaX * this._inputMultiplier,true, true);
	var y = this._resolveScrollDeltaY(deltaY * this._inputMultiplier,true, true);
	this._setScrollPosition(x, y);
	this._updateDomScrollPosition();
};









//PUBLIC
//__________________________________________________________________________________________
ScrollPanelController.prototype.clear  = function(){
	this._stopTweenAnimation();
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
	this._stopTweenAnimation();
	this._setScrollPosition(this._x,y);
};

ScrollPanelController.prototype.getScrollX = function(){
	return this._x;
}
ScrollPanelController.prototype.setScrollX = function(x){
	this._stopTweenAnimation();
	this._setScrollPosition(x,this._y);
};

ScrollPanelController.prototype.getScrollPosition = function(){
	return {x:this.getScrollX(),y:this.getScrollY()};
}
ScrollPanelController.prototype.setScrollPosition = function(x,y){
	this._stopTweenAnimation();
	this._setScrollPosition(x,y);	
}

ScrollPanelController.prototype.setDelegate = function(delegate){
	this._delegate = delegate;
};

ScrollPanelController.prototype.setScrollBarDelegate = function(delegate){
	this._scrollDelegate = delegate;
};