/*
Note: this code is very old (ca. 2014), and written before I knew anything about
writing code that human beings might actually read!
It is not reflective of my current style, and is frankly pretty tough to look at.
Scroll down at your own risk.
*/


App={};

App.bpmEl;
App.moreInfoEls=[];

//TAP HANDLER/////////////////////////////////////

App.tapped=false;
App.tapMs=[];
App.tapTime=0;
App.avgMs;

App.handleTap=function(e) {
	App.tapped=true;
	var time=new Date().getTime();
	if(App.tapTime!==0) {
		App.tapMs.push(time-App.tapTime);
	}
	if(time-App.tapTime<5000 || App.tapMs.length===0) {
		App.tapTime=time;
		if(App.tapMs.length>0) {
			var totalMs=0;
			for(var tap=0;tap<App.tapMs.length;tap++) {
				totalMs+=App.tapMs[tap];
			}
			App.avgMs=totalMs/App.tapMs.length;
			var bpm=1/App.avgMs*60000;
			App.bpmEl.innerHTML=Math.round(bpm);
			App.moreInfoEls[0].innerHTML=Math.round(bpm*1000)/1000+', to be precise';
			App.moreInfoEls[1].innerHTML=Math.round(App.avgMs)+'ms between taps';
			App.moreInfoEls[2].innerHTML='Based on '+(App.tapMs.length+1)+' taps';
		}
	} else {
		App.tapMs=[];
		App.tapTime=time;
		App.bpmEl.innerHTML='0';
		App.moreInfoEls[0].innerHTML='There were no taps for 5';
		App.moreInfoEls[1].innerHTML='seconds, so the counter';
		App.moreInfoEls[2].innerHTML='was reset.';
	}
}

window.addEventListener('keydown',App.handleTap);

//GRAPH//////////////////////////////////////////

App.Graph={};

App.Graph.height=500;
App.Graph.width=750;
App.Graph.fps=60;
App.Graph.transitionDivisor=4;

App.Graph.el;
App.graph;
App.Graph.pointMin;
App.Graph.pointMax;
App.Graph.monoScale=false;

App.Graph.lineTargetPos=[];
App.Graph.lineCurrentPos=[];
App.Graph.pointTargetPos=[];
App.Graph.pointCurrentPos=[];
App.Graph.meanCurrentPos;
App.Graph.meanTargetPos;

App.Graph.update=function() {
	window.setTimeout(App.Graph.update,1000/App.Graph.fps);
	if(App.tapMs.length>1) {
		if(App.tapped) {
			if(App.tapMs.length===2) { //IF UNHANDLED TAP BUT GRAPH NOT YET READY
				App.Graph.lineCurrentPos=[0,App.Graph.width]; //Create first 2 vertical lines
				App.Graph.lineTargetPos=[0,App.Graph.width];
				App.Graph.pointCurrentPos=[0,0]; //Set scale and create first 2 points
				if(App.tapMs[0]>App.tapMs[1]) {
					App.Graph.pointMax=App.tapMs[0];
					App.Graph.pointMin=App.tapMs[1];
					App.Graph.pointTargetPos=[0,App.Graph.height];
				} else if(App.tapMs[0]<App.tapMs[1]) {
					App.Graph.pointMax=App.tapMs[1];
					App.Graph.pointMin=App.tapMs[0];
					App.Graph.pointTargetPos=[App.Graph.height,0];
				} else {
					App.Graph.pointMax=App.tapMs[0]+0.5;
					App.Graph.pointMin=App.tapMs[0]-0.5;
					App.Graph.pointTargetPos=[App.Graph.height/2,App.Graph.height/2];
					App.Graph.monoScale=true;
				}
				App.Graph.meanCurrentPos=0; //Place mean line
				App.Graph.meanTargetPos=App.Graph.height/2;
			} else { //IF UNHANDLED TAP AND GRAPH READY
				var newLineSpace=App.Graph.width/(App.tapMs.length-1); //Update target position of lines
				for(var line=1;line<App.Graph.lineTargetPos.length;line++) {
					App.Graph.lineTargetPos[line]=newLineSpace*line;
				}
				App.Graph.lineTargetPos.push(App.Graph.width); //Add new line
				App.Graph.lineCurrentPos.push(App.Graph.width+newLineSpace);
				var oldPointSpace=App.Graph.height/(App.Graph.pointMax-App.Graph.pointMin);
				if(App.tapMs[App.tapMs.length-1]>App.Graph.pointMax) { //Update Y-scale
					App.Graph.pointMax=App.tapMs[App.tapMs.length-1];
					if(App.Graph.monoScale) {
						App.Graph.pointMin+=0.5;
						App.Grap.monoScale=false;
					}
				} else if(App.tapMs[App.tapMs.length-1]<App.Graph.pointMin) {
					App.Graph.pointMin=App.tapMs[App.tapMs.length-1];
					if(App.Graph.monoScale) {
						App.Graph.pointMax-=0.5;
						App.Graph.monoScale=false;
					}
				}
				var newPointSpace=App.Graph.height/(App.Graph.pointMax-App.Graph.pointMin); //Update point position
				for(var point=0;point<App.tapMs.length;point++) {
					App.Graph.pointTargetPos[point]=App.Graph.height-(App.tapMs[point]-App.Graph.pointMin)*newPointSpace;
				}
				App.Graph.pointCurrentPos.push(App.Graph.height-(App.tapMs[App.tapMs.length-1]-App.Graph.pointMin)*oldPointSpace); //Add new point
				App.Graph.meanTargetPos=App.Graph.height-(App.avgMs-App.Graph.pointMin)*newPointSpace;
			}
			App.tapped=false;
		} //else { //IF NO UNHANDLED TAP BUT GRAPH READY
			for(var line=1;line<App.Graph.lineTargetPos.length;line++) { //Move lines towards target positon
				App.Graph.lineCurrentPos[line]-=(App.Graph.lineCurrentPos[line]-App.Graph.lineTargetPos[line])/App.Graph.transitionDivisor;
			}
			for(var point=0;point<App.Graph.pointTargetPos.length;point++) { //Move points towards target position
				App.Graph.pointCurrentPos[point]-=(App.Graph.pointCurrentPos[point]-App.Graph.pointTargetPos[point])/App.Graph.transitionDivisor;
			}
			App.Graph.meanCurrentPos-=(App.Graph.meanCurrentPos-App.Graph.meanTargetPos)/App.Graph.transitionDivisor; //Move mean line towards target position
		//}
		App.Graph.draw();
	} else { //IF DATA INSUFFICIENT TO READY GRAPH
		App.graph.clearRect(0,0,App.Graph.width,App.Graph.height);
	}
}

App.Graph.draw=function() {
	App.graph.clearRect(0,0,App.Graph.width,App.Graph.height); //CLEAR CANVAS
	App.graph.strokeStyle='#d0d0d0'; //DRAW VERTICAL LINES
	App.graph.lineWidth='1';
	for(var line=0;line<App.Graph.lineCurrentPos.length;line++) {
		App.graph.beginPath();
		App.graph.moveTo(App.Graph.lineCurrentPos[line],0);
		App.graph.lineTo(App.Graph.lineCurrentPos[line],App.Graph.height);
		App.graph.stroke();
	}
	App.graph.strokeStyle='#e74c3c'; //DRAW GRAPH POINTS
	App.graph.lineWidth='3';
	App.graph.lineJoin='round';
	App.graph.beginPath();
	App.graph.moveTo(0,App.Graph.pointCurrentPos[0]);
	for(var point=1;point<App.Graph.pointCurrentPos.length;point++) {
		App.graph.lineTo(App.Graph.lineCurrentPos[point],App.Graph.pointCurrentPos[point]);
	}
	App.graph.stroke();
	App.graph.strokeStyle='#3498db';
	App.graph.lineWidth='1';
	App.graph.beginPath();
	App.graph.moveTo(0,App.Graph.meanCurrentPos);
	App.graph.lineTo(App.Graph.width,App.Graph.meanCurrentPos);
	App.graph.stroke();
}

//STARTUP////////////////////////////////////////

window.onload=function() {
	App.bpmEl=document.getElementById('bpm');
	App.moreInfoEls=document.getElementsByClassName('otherinfo');
	App.Graph.el=document.getElementById('graph');
	App.graph=App.Graph.el.getContext('2d');
	App.Graph.el.width=App.Graph.width;
	App.Graph.el.height=App.Graph.height;
	var info=document.getElementById('info-container');
	var infoRect=info.getBoundingClientRect();
	var infoWidth=infoRect.width;
	var infoHeight=infoRect.height;
	App.Graph.el.style.marginLeft=infoWidth+'px';
	info.removeAttribute('style');
	info.style.position='absolute';
	info.style.width=(infoWidth-40)+'px';
	info.style.height=infoHeight+'px';
	var ui=document.getElementById('ui-container');
	var uiRect=ui.getBoundingClientRect();
	var uiWidth=uiRect.width;
	var uiHeight=uiRect.height;
	ui.removeAttribute('style');
	ui.style.position='absolute';
	ui.style.width=(uiWidth-2)+'px';
	ui.style.height=(uiHeight-7)+'px';
	App.Graph.update();
}