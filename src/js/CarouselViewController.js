var CarouselViewController = function(options){
	
	this._frameElement = options.frameElement;
	this._contentElement = options.contentElement;
	this._scrollDirection = options.scrollDirection || ScrollPanelController.SCROLL_DIRECTION_HORIZONTAL;
	this._scrollPanelController;
	
	this._init();
};

CarouselViewController.SCROLL_DIRECTION_VERTICAL = 0;
CarouselViewController.SCROLL_DIRECTION_HORIZONTAL = 1;





//PRIVATE
//_______________________________________________________________________
CarouselViewController.prototype._init = function(){
	
	$(this._contentElement).children().first().clone().appendTo(this._contentElement);
	$(this._contentElement).css('width', $(this._contentElement).children().length * 960);
	
	var options  = {
		scrollDirection:this._scrollDirection,
		frameWidth:$(this._frameElement).width(),
		contentWidth:$(this._contentElement).width(),
		frameElement:(this._frameElement),
		wrap:true,
	};
	this._scrollPanelController = new ScrollPanelController(options);
	this._scrollPanelController.setDelegate(this);
};


//ScrollPanelController Delegate Methods
//_______________________________________________________________________
CarouselViewController.prototype.updatePosition = function(x,y){
	$(this._contentElement).css({left:x,top:y});
}	

