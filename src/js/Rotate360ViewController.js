var Rotate360ViewController = function(options){
	
	this._frameElement = options.frameElement;
	this._imageElement = options.imageElement;
	this._imagePathTop = options.imagePathTop;
	this._imagePathTail = options.imagePathTail;
	this._imageSequencePadding = options.imageSequencePadding;

	this._scrollPanelController;
	
	this._init();
};





//PRIVATE
//_______________________________________________________________________
Rotate360ViewController.prototype._init = function(){
	var options  = {
		scrollDirection:ScrollPanelController.SCROLL_DIRECTION_HORIZONTAL,
		contentWidth:128,
		frameElement:(this._frameElement),
		inputMultiplier:0.25,
		friction:0.75,
		wrap:true
	};
	this._scrollPanelController = new ScrollPanelController(options);
	this._scrollPanelController.setDelegate(this);
};

Rotate360ViewController.prototype._padNumberOutTo = function(n,p){
	var str = String(n);
	while(str.length < p){
		str = "0" + str;	
	}
	return str;
}


//ScrollPanelController Delegate Methods
//_______________________________________________________________________
Rotate360ViewController.prototype.updatePosition = function(x,y){
	var degree = Math.round(Math.abs(x));

	
	this._imageElement.src = this._imagePathTop + this._padNumberOutTo(degree,this._imageSequencePadding) + this._imagePathTail;
	
}	
