var ThumbController = function(options){
	
	this._frameElement = options.frameElement;
	this._scrollDirection = options.scrollDirection || ThumbController.SCROLL_DIRECTION_VERTICAL;
	this._scrollPanelViewController = options.scrollPanelViewController;
	
	this._init();
};

ThumbController.SCROLL_DIRECTION_VERTICAL = 0;
ThumbController.SCROLL_DIRECTION_HORIZONTAL = 0;



ThumbController.prototype._init = function(){
	
};

ThumbController.prototype.build = function(){
	switch(this._scrollDirection){
		case ThumbController.SCROLL_DIRECTION_VERTICAL:
			$(this._frameElement).append('<div class="touchScrollPanelVerticleThumbContainer"><div class="touchScrollPanelVerticleThumb"><div class="touchScrollPanelThumbGraphics"></div></div></div>');
			this._thumbElement = $(this._frameElement).find('.touchScrollPanelVerticleThumb')[0];
			this._thumbContainerElement = $(this._frameElement).find('.touchScrollPanelVerticleThumbContainer')[0];
			break;
		case ThumbController.SCROLL_DIRECTION_HORIZONTAL:
			$(this._frameElement).append('<div class="touchScrollPanelHorizontalThumbContainer"><div class="touchScrollPanelHorizontalThumb"><div class="touchScrollPanelThumbGraphics"></div></div></div>');
			this._thumbElement = $(this._frameElement).find('.touchScrollPanelHorizontalThumb')[0];
			this._thumbContainerElement = $(this._frameElement).find('.touchScrollPanelHorizontalThumbContainer')[0];
			break;
	}
	//this.onFadeOutThumb();
	//this.updateThumb();
};


ThumbController.prototype._drawThumb = function(normalisedScrollPosition, normalisedThumbDimension){
	
	var containerPosition;
	var thumbDimension;
	var frameWidth = this._frameElement.clientWidth;
	if(this._scrollDirection === ThumbController.SCROLL_DIRECTION_VERTICAL){
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