var qc_processor = {
  timerCallback: function() {
    this.computeInverseFrame();
    let self = this;
    setTimeout(function () {
        self.timerCallback();
      }, 0);
  },
  goFull: function() {
    var el = document.getElementById('c2');
    if(el.webkitRequestFullScreen) {
      el.webkitRequestFullScreen();
    }
    else {
      el.mozRequestFullScreen();
    }
  },
  load: function() {
    var width = 0.8*window.innerWidth;
    var height = 0.8*window.innerHeight;
    if(width < height) {
      this.size = Math.round(width)
    }
    else {
      this.size = Math.round(height)
    }
    var container = document.getElementById("video_container");
    container.style.margin = "0 auto";
    container.style.width = this.size + "px";
    this.video = document.getElementById("video");
    this.c1 = document.getElementById("c1");
    this.ctx1 = this.c1.getContext("2d");
    this.c2 = document.getElementById("c2");
    this.ctx2 = this.c2.getContext("2d");
    c1.width = this.size;
    c1.height = this.size;
    c2.width = this.size;
    c2.height = this.size;
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
          if ("srcObject" in this.video) {
            this.video.srcObject = stream;
          } else {
            // Avoid using this in new browsers, as it is going away.
            this.video.src = window.URL.createObjectURL(stream);
          }
        });
    }
    this.timerCallback();
  },
  square: function(j,i){
    var r = 1.5; // Half the width of the displayed square in the complex plane
    var e1 = -1 + (2*j)/this.size;
    var e2 = -1 + (2*i)/this.size;
    var jj = Math.round(this.size*(1 + r*e1*e1 - r*e2*e2)/2);
    var ii = Math.round(this.size*(1 + 2*r*(e1*e2))/2);
    return [jj,ii]
  },
  computeInverseFrame: function() {
    this.ctx1.drawImage(this.video, 0, 0, this.size, this.size);
    var old_frame = this.ctx1.getImageData(0, 0, this.size, this.size);
    var new_frame = this.ctx2.createImageData(old_frame);
    for(var i=0; i<this.size; i++) {
      for(var j=0; j<this.size; j++) {
        var squared = this.square(j,i);
        var jj = squared[0];
        var ii = squared[1];
        var p = (i * (this.size * 4)) + (j * 4)
        if(0 <= ii && ii < this.size && 0 <= jj && jj < this.size){
          var pp = (ii * (this.size * 4)) + (jj * 4)
          new_frame.data[p] = old_frame.data[pp];
          new_frame.data[p+1] = old_frame.data[pp+1];
          new_frame.data[p+2] = old_frame.data[pp+2];
          new_frame.data[p+3] = old_frame.data[pp+3];
        }
        else {
          new_frame.data[p] = 200;
          new_frame.data[p+1] = 200;
          new_frame.data[p+2] = 200;
          new_frame.data[p+3] = 255;
        }
      }
    }
    this.ctx2.putImageData(new_frame, 0, 0);
    return;
  }
};
qc_processor.load()
