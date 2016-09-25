/*

Copyright (C) 2013 David Dupplaw

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/
/**
 *  	Data is drawn from the right to the left
 * 	in reverse order. Data is expected to be
 *	consecutively integer indexed.
 *
 *		Requires:
 *			jquery.timers
 *			canvas_utils
 * 
 * 	@author David Dupplaw <dpd@ecs.soton.ac.uk>
 *	@created December 2011
 *	@version 1.0
 */
(function($){
	
var SlidingBarGraphWidget =
{
	/** Get the width of the widget */
	getWidth: function() { return this.options.width; },
	
	/** Set the width of the widget */
	setWidth: function(w) { this.options.width = w; this.element.width(w); this._updateGraph(); },

	/** Get the height of the widget */
	getHeight: function() { return this.options.height; },
	
	/** Set the height of the widget */
	setHeight: function(h) { this.options.height = h; this.element.height(h); this._updateGraph(); },

	/** Get the X axis label */
	getXAxisLabel: function() { return this.options.XAxisLabel; },
	
	/** Set the X axis label */
	setXAxisLabel: function(h) { this.options.XAxisLabel = h; this._updateGraph(); },

	/** Get the Y axis label */
	getYAxisLabel: function() { return this.options.YAxisLabel; },
	
	/** Set the Y axis label */
	setYAxisLabel: function(h) { this.options.YAxisLabel = h; this._updateGraph(); },
	
	/** Set the width of each bar */
	setBarWidth: function(w) {this.options.tickXWidth = w; this._updateGraph(); },
	
	/** Get the data being displayed */
	getData: function() { return this._data },

	/** Set the data to display */	
	setData: function(d) { this._dataAwaitingDisplay = d; this._updateGraph(); },

	/** Add data to the data stream */
	addData: function(d) { 
		if( this._dataAwaitingDisplay == null )
			this.setData( d );
		else {
			this._dataAwaitingDisplay.push(d); this.updateGraph();
		} 
	},

	
	/** Gets the maximum data value */
	getMaxDataValue: function()
	{
		var max = 0;
		var data = this.getData();
		for( i = 0; i < data.length; i++ )
			if( data[i]-0 > max-0 )
				max = data[i]-0;
		return max;		
	},

	/** [private]  Function that creates the canvas element */
	_create: function()
	{
		var caption = $("<p id='"+this.element.attr("id")+"_caption' class='caption'>"+this.options.title+"</p>");
		
		if( this.options.titlePosition == "above" && this.options.title != "" )
			this.element.append( caption );
		
		this.element.append( "<canvas id='"+
			this.element.attr("id")+"_canvas' />" );

		if( this.options.titlePosition == "below" && this.options.title != "" )
			this.element.append( caption );

		this.setWidth( this.getWidth() );
		this.setHeight( this.getHeight() );	
	},
	
	/** Forces and update of the graph display */
	_updateGraph: function()
	{
		var currentSlideOffset = this._currentSlideOffset;
		
		if( this._data == null ) this._data = new Array();
		if( this._dataAwaitingDisplay == null ) this._dataAwaitingDisplay = new Array();
		
		if( this._data.length == 0 && this._dataAwaitingDisplay.length > 0 )
		{
			// Push the new data on the end
			this._data.push( this._dataAwaitingDisplay.pop() );

			// Remove the first element of data (because it's sliding along)
			this._dataAwaitingDisplay.splice(0,1);
		}
		
		if( this._dataAwaitingDisplay.length > 0 )
		{
			// If we haven't slid along enough, we must continue to slide
			if( currentSlideOffset > -this.options.tickXWidth )
			{
				if( this.options.autoScale )
				{
					var maxY = this.options.maxY;
					if( this._dataAwaitingDisplay[0] > maxY )
						this.options.maxY = maxY+(this._dataAwaitingDisplay[0]-maxY)/2;
					else
					{
						// have to include the new data in our calculation
						var maxDataValue = this.getMaxDataValue();
						maxDataValue = Math.max( maxDataValue, this._dataAwaitingDisplay[0] );
						
						if( maxDataValue < maxY )
							this.options.maxY = maxY-(maxY-maxDataValue)/2;
					}
				} 
				
				currentSlideOffset -= this.options.animationStepSize;
				this._currentSlideOffset = currentSlideOffset;
				var speed = this.options.animationSpeed;
				var x = this;
				this.element.oneTime( speed, function(){
					x._updateGraph(); 
				});
			}
			// oterwise we add the new data to the data display and reset
			// the slide
			else
			{
				// Pop the latest newData value onto the data-to-display array
				this._data.push( this._dataAwaitingDisplay[0] );
				this._dataAwaitingDisplay.splice(0,1);
				
				// reset the slide
				currentSlideOffset = 0;
				this._currentSlideOffset = currentSlideOffset;

				var speed = this.options.animationSpeed;
				var x = this;
				this.element.oneTime( speed, function(){
					x._updateGraph(); 
				});
			}
		}
				
		var canvas = document.getElementById( this.element.attr("id")+"_canvas" );
		canvas.width = this.getWidth();
		canvas.height = this.getHeight();

		var ctx = canvas.getContext('2d');
		
		this.drawGraphLabels( ctx );
		ctx.strokeStyle = this.options.axesStyle;
		ctx.lineWidth = this.options.axesWidth;
		this.drawYAxis( ctx );
		this.drawXAxis( ctx );		
		this.drawData( ctx );
	},
	
	/** Draws the labels onto the graph */
	drawGraphLabels: function( ctx )
	{
		var width = this.getWidth();
		var height = this.getHeight();
		var xAxis = this.getXAxisLabel();
		var xLabelDim = ctx.measureText( xAxis );
		var yAxis = this.getYAxisLabel();
		var yLabelDim = ctx.measureText( yAxis );

		// Draw X axis label
	  	ctx.fillStyle = this.options.axesLabelStyle;
	  	ctx.font = "8pt Helvetiker, sans-serif";				
	  	ctx.fillText( xAxis, (width/2)-(xLabelDim.width/2), height );
		
		// Draw Y axis label
		ctx.save();
		ctx.rotate( Math.PI/2 );
	  	ctx.font = "8pt Helvetiker, sans-serif";				
	  	ctx.fillText( yAxis, (height/2)-(yLabelDim.width/2), 0 );
		ctx.restore();
	},
	
	/** Draws the X axis */
	drawXAxis: function( ctx )
	{
		var width = this.getWidth();
		var height = this.getHeight();
		
		var xAxisFromBottom = this.options.XAxisFromBottom;
		var yAxisFromLeft = this.options.YAxisFromLeft;
		
		// Draw X axis
		drawPolygon( ctx, [ [yAxisFromLeft, height-xAxisFromBottom], 
							[width, height-xAxisFromBottom] ] );

	},
	
	/** Draws the Y Axis */
	drawYAxis: function( ctx ) 
	{
		var width = this.getWidth();
		var height = this.getHeight();
		var xAxisFromBottom = this.options.XAxisFromBottom;
		var yAxisFromLeft = this.options.YAxisFromLeft;
		
		// Draw major values
		ctx.save();
		var maxY = this.options.maxY;
		var minY = this.options.minY;
		var yScale = (height-xAxisFromBottom)/(maxY-minY);
		var diff = maxY - minY;
		var startSpacing = 4;
		
		var graphHeight = height-xAxisFromBottom;
		var spacing = graphHeight/startSpacing;
		var valSpacing = diff/startSpacing;
		var minSpacing = this.options.minYTickSpacing;
		while( spacing < minSpacing )
		{
			valSpacing *= 2;
			spacing *= 2;
		} 
		
		valSpacing = Math.floor( valSpacing );
		if( valSpacing == 0 )
			valSpacing = 1;
		
		ctx.lineWidth = this.options.tickLineWidth;
		ctx.strokeStyle = this.options.tickStyle;
		
		var y = minY;
		var yy = (height-xAxisFromBottom)-(y*yScale); 
		while( yy > 0 )
		{
			y += valSpacing;
			yy = (height-xAxisFromBottom)-(y*yScale);
			
			drawLine( ctx, [[yAxisFromLeft,yy],[width,yy]] );

		  	ctx.fillStyle = ctx.strokeStyle;
		  	ctx.font = "7pt Helvetiker, sans-serif";				
	  		ctx.fillText( ""+y, yAxisFromLeft+2, yy-2 );
			
		}
		ctx.restore();
		
		// Draw Y axis
		drawPolygon( ctx, [ [yAxisFromLeft, height-xAxisFromBottom], 
							[yAxisFromLeft, 0] ] );							
	},
	
	/** Draws the bar chart */
	drawData: function( ctx )
	{
		if( this._data.length == 0 )
			return;		

		var currentSlideOffset = this._currentSlideOffset;		
		var width = this.getWidth();
		var height = this.getHeight();
		var tickWidth = this.options.tickXWidth;
		var styles = this.options.style;
		var dataPointStyle = this.options.dataPointStyle;
		var xAxisFromBottom = this.options.XAxisFromBottom;
		var yAxisFromLeft = this.options.YAxisFromLeft;
		var maxY = this.options.maxY;
		var minY = this.options.minY;
		var i = 0;
		
		ctx.lineWidth = this.options.barStrokeWidth;
		ctx.strokeStyle = this.options.barStrokeStyle;
		ctx.fillStyle = this.options.barFillStyle;
		
		var removeFrom = -1;
		if( styles.indexOf("bar") != -1 )
		{
			var xAxisYPos = (height-xAxisFromBottom); 
			var yScale = xAxisYPos/(maxY-minY);
			
			for( i = this._data.length-1; i >= 0; i-- )
			{
				var index = this._data.length - i;
				var xPos = width-(index*tickWidth)+currentSlideOffset;
				var poly = new Array();
				if( xPos-tickWidth/2 >= yAxisFromLeft )
				{
					poly.push( [xPos-tickWidth/2, xAxisYPos ] );
					poly.push( [xPos-tickWidth/2, xAxisYPos-(this._data[i]*yScale)] );
					poly.push( [xPos+tickWidth/2, xAxisYPos-(this._data[i]*yScale)] );
					poly.push( [xPos+tickWidth/2, xAxisYPos ] );
				}
				else
				{
					if( i > removeFrom )
						removeFrom = i;
				}

				if( styles.indexOf("filledbar") != -1 )
					fillPolygon( ctx, poly );
					
				drawPolygon( ctx, poly );
			}			
		}
		
		ctx.lineWidth = this.options.lineStrokeWidth;
		ctx.strokeStyle = this.options.lineStrokeStyle;

		if( styles.indexOf( "line" ) != -1 )
		{
			var linepoly = new Array();
			var yScale = (height-xAxisFromBottom)/(maxY-minY);
			for( i = this._data.length-1; i >= 0; i-- )
			{
				var index = this._data.length - i;
				var xPos = width-index*tickWidth+currentSlideOffset;
				if( xPos >= yAxisFromLeft )
				{
					linepoly.push( [xPos, (height-xAxisFromBottom)-(this._data[i]*yScale) ] )
				}
				else
				{
					if( i > removeFrom )
						removeFrom = i;
				}	
			}
			drawLine( ctx, linepoly );
		}
		
		// Remove any data we're not displaying
		this._data.splice( 0, removeFrom );
			
		ctx.lineWidth = this.options.dataPointLineStrokeWidth;
		ctx.strokeStyle = this.options.dataPointStrokeStyle;
		ctx.fillStyle = this.options.dataPointFillStyle;
		
		if( dataPointStyle == "circle" || dataPointStyle == "filledCircle" )
		{
			var yScale = (height-xAxisFromBottom)/(maxY-minY);
			var circleSize = this.options.circleSize;
			for( i = this._data.length-1; i >= 0; i-- )
			{
				var index = this._data.length - i;
				var xPos = width-index*tickWidth+currentSlideOffset;
				if( xPos >= yAxisFromLeft )
				{
					ctx.beginPath();
					ctx.arc( width-index*tickWidth+currentSlideOffset, 
						(height-xAxisFromBottom)-(this._data[i]*yScale), 
						circleSize, 0, Math.PI*2, true); 
					ctx.closePath();
					
					if( dataPointStyle == "filledCircle" )
						ctx.fill();
					ctx.stroke();
				}			
			}
		}
		else
		if( dataPointStyle == "square" || dataPointStyle == "filledSquare" )
		{
			var yScale = (height-xAxisFromBottom)/(maxY-minY);
			var squareSize = this.options.squareSize;
			for( i = this._data.length-1; i >= 0; i-- )
			{
				var index = this._data.length - i;
				var xPos = width-index*tickWidth+currentSlideOffset;
				if( xPos >= yAxisFromLeft )
				{
					ctx.beginPath();
					ctx.rect( width-index*tickWidth+currentSlideOffset-squareSize/2, 
						(height-xAxisFromBottom)-(this._data[i]*yScale)-squareSize/2, 
						squareSize, squareSize ); 
					ctx.closePath();
					
					if( dataPointStyle == "filledSquare" )
						ctx.fill();
					ctx.stroke();
				}			
			}			
		}
	},
	
	/** Destroy the plugin */
	destroy: function()
	{
		$(this).find('.caption').remove();
		$(this).find('canvas').remove();
		$.Widget.prototype.destroy.call(this);
	},
	
	/** Update the graph when an option changes */
	_setOption: function( key, value )
	{
		this.options[key] = value;
		this._updateGraph();
	},

	/** The options */
	options:
	{
		// The data being dislayed
		data: null,
	
		// Style of the graphs
		// "bar" or "filledbar"
		style: "filledbar", 
		
		// "circle" or "square" or
		// "filledCircle" or "filledSquare"
		dataPointStyle: "square",
		
		// The stroke, fill colour and stroke width
		// of the bars that are drawn in bar mode
		barStrokeWidth: 1,
		barFillStyle: '#FFAA00',
		barStrokeStyle: '#000',
		
		// The sizes of the data point markerss
		squareSize: 4,
		circleSize: 4,
		
		// The style of the data point markers
		// (the circles and squares)
		dataPointLineStrokeWidth: 1,
		dataPointStrokeStyle: '#000',
		dataPointFillStyle: 'rgba(255,0,0,128)',

		// The stroke and colour of the data line
		lineStrokeWidth: 2,
		lineStrokeStyle: '#06B',
			
		// The width and height of the drawing canvas
		width: 400,
		height: 150,
		
		// Whether to auto-scale the Y axis
		autoScale: true,
		
		// Whether to draw the axes
		drawXAxis: true,
		drawYAxis: true,
		
		// The Axis labels and positions
		XAxisLabel: "X-Axis",
		XAxisFromBottom: 15,
		YAxisLabel: "Y-Axis",
		YAxisFromLeft: 15,
		
		// Colour of the axes labels
		axesLabelStyle: '#000',
		
		// The width and colour of the axes lines
		axesStyle: '#000',
		axesWidth: 1,
		
		// Default scaling on the Y axis
		// (will be over-ridden if autoScale is true)
		maxY: 10,
		minY: 0,
		
		// The minimum spacing of the value lines
		// on the graph Y axis
		minYTickSpacing: 10,
		
		// The style of the value lines on the graph
		// Y axis (including the value text)
		tickLineWidth: 1,
		tickStyle: '#AAA',
		
		// Scaling on the X axis
		tickX: 1,
		tickXWidth: 25,
		
		// At what speed to slide the graph along
		animationSpeed: 10,
		animationStepSize: 2,
	
		// The title to show for the table
		title: "",
		
		// Whether the caption is shown above or below the table
		titlePosition: "below"
	} 
}

$.widget( "dd.bargraph", SlidingBarGraphWidget );

}(jQuery));
