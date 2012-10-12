var CarouselSnapViewController = function(options){
	
	this._frameElement = options.frameElement;
	this._contentElement = options.contentElement;
	this._scrollDirection = options.scrollDirection || ScrollPanelController.SCROLL_DIRECTION_HORIZONTAL;
	this._scrollPanelController;
	
	this._init();
};

CarouselSnapViewController.SCROLL_DIRECTION_VERTICAL = 0;
CarouselSnapViewController.SCROLL_DIRECTION_HORIZONTAL = 1;





//PRIVATE
//_______________________________________________________________________
CarouselSnapViewController.prototype._init = function(){
	
	$(this._contentElement).css('width', $(this._contentElement).children().length * 960);
	
	var options  = {
		scrollDirection:this._scrollDirection,
		frameWidth:$(this._frameElement).width(),
		contentWidth:$(this._contentElement).width(),
		frameElement:(this._frameElement),
		wrap:false,
		bounce:true,
		snap:true
	};
	this._scrollPanelController = new ScrollPanelController(options);
	this._scrollPanelController.setDelegate(this);
};


//ScrollPanelController Delegate Methods
//_______________________________________________________________________
CarouselSnapViewController.prototype.updatePosition = function(x,y){
	$(this._contentElement).css({left:x,top:y});
}	

