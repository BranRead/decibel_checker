
// https://stackoverflow.com/questions/33322681/checking-microphone-volume-in-javascript
// The above site is what I used for the basic checking microphone level
// function VolumeMeter(context){
//     this.context = context;
//     this.volume = 0.0;
//     this.script = context.createScriptProcessor(2048, 1, 1);

//     const that = this;
//     this.script.onaudioprocess = function(event) {
//         const input = event.inputBuffer.getChannelData(0);
//         var sum = 0.0;
//         for(var i = 0; i < input.length; ++i) {
//             sum += input[i] * input[i];
//         }

//     that.volume = Math.sqrt(sum / input.length);
//     }
// }

// navigator.mediaDevices.getUserMedia({"audio": true})
// .then((stream) => {
//     let ctx = new AudioContext();
//     const volumeMeter = new VolumeMeter(ctx);

//     console.log(volumeMeter.volume);
    
    
//     // console.log(stream.audio)
// })

// navigator.mediaDevices.getUserMedia({
//     audio: true,
//     video: true
//   })
//     .then(function(stream) {
//       const audioContext = new AudioContext();
//       const analyser = audioContext.createAnalyser();
//       const microphone = audioContext.createMediaStreamSource(stream);
//       const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);
  
//       analyser.smoothingTimeConstant = 0.8;
//       analyser.fftSize = 1024;
  
//       microphone.connect(analyser);
//       analyser.connect(scriptProcessor);
//       scriptProcessor.connect(audioContext.destination);
//       scriptProcessor.onaudioprocess = function() {
//         const array = new Uint8Array(analyser.frequencyBinCount);
//         analyser.getByteFrequencyData(array);
//         const arraySum = array.reduce((a, value) => a + value, 0);
//         const average = arraySum / array.length;
//         document.getElementById("decibels").innerText = (Math.round(average));
//         // colorPids(average);
//       };
//     })
//     .catch(function(err) {
//       /* handle the error */
//       console.error(err);
//     });

(async () => {
    let volumeCallback = null;
    let volumeInterval = null;
    const volumeVisualizer = document.getElementById('visualizer');
    const decibelText = document.getElementById('decibels');
    const startButton = document.getElementById('start');
    const stopButton = document.getElementById('stop');
    // Initialize
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true
        }
      });
      const audioContext = new AudioContext();
      const audioSource = audioContext.createMediaStreamSource(audioStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.minDecibels = -127;
      analyser.maxDecibels = 0;
      analyser.smoothingTimeConstant = 0.4;
      audioSource.connect(analyser);
      const volumes = new Uint8Array(analyser.frequencyBinCount);
      volumeCallback = () => {
        analyser.getByteFrequencyData(volumes);
        let volumeSum = 0;
        for(const volume of volumes)
          volumeSum += volume;
        const averageVolume = volumeSum / volumes.length;
        // Value range: 127 = analyser.maxDecibels - analyser.minDecibels;
        volumeVisualizer.style.setProperty('--volume', (averageVolume * 100 / 127) + '%');
        decibelText.innerText = Math.round(averageVolume * 100 / 127);
        if(Math.round(averageVolume * 100 / 127) > 60){
            document.body.style.backgroundColor = "red";
        } else {
            document.body.style.backgroundColor = "white";
        }

        if(Math.round(averageVolume * 100 / 127) > document.getElementById("loudest").innerText){
          document.getElementById("loudest").innerText = Math.round(averageVolume * 100 / 127)
        }
        
      };
    } catch(e) {
      console.error('Failed to initialize volume visualizer, simulating instead...', e);
      // Simulation
      //TODO remove in production!
      let lastVolume = 50;
      volumeCallback = () => {
        const volume = Math.min(Math.max(Math.random() * 100, 0.8 * lastVolume), 1.2 * lastVolume);
        lastVolume = volume;
        volumeVisualizer.style.setProperty('--volume', volume + '%');
      };
    }
    // Use
    startButton.addEventListener('click', () => {
      // Updating every 100ms (should be same as CSS transition speed)
      if(volumeCallback !== null && volumeInterval === null)
        volumeInterval = setInterval(volumeCallback, 100);
    });
    stopButton.addEventListener('click', () => {
      if(volumeInterval !== null) {
        clearInterval(volumeInterval);
        volumeInterval = null;
      }
    });
  });