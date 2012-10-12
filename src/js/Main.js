$(document).ready(function(){

	var app = {
		init:function(){
			var options = {
				frameElement:$('#frame').get(0),
				contentElement:$('#container').get(0),
				scrollDirection:ScrollPanelController.SCROLL_DIRECTION_BOTH
			};
			var scrollPanelViewController = new ScrollPanelViewController(options);
			
			var options = {
				frameElement:$('#rotate360Frame').get(0),
				imageElement:$('#rotate360Image').get(0),
				imagePathTop:"http://pitch.sequence.co.uk/canon/360/tight%2060/360%20tight_",
				imagePathTail:".jpg",
				imageSequencePadding:5
			};
			var rotate360ViewController = new Rotate360ViewController(options);
			
			var options = {
				frameElement:$('#carousel-frame').get(0),
				contentElement:$('#carousel-container').get(0),
				scrollDirection:ScrollPanelController.SCROLL_DIRECTION_HORIZONTAL
			};
			var carouselViewController = new CarouselViewController(options);

			var options = {
				frameElement:$('#carousel-snap-frame').get(0),
				contentElement:$('#carousel-snap-container').get(0),
				scrollDirection:ScrollPanelController.SCROLL_DIRECTION_HORIZONTAL
			};
			var carouselSnapViewController = new CarouselSnapViewController(options);
			
			
		}
	}
	
	app.init();
	
});