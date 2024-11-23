
// https://stackoverflow.com/questions/33322681/checking-microphone-volume-in-javascript
// The above site is what I used for the basic checking microphone level

(async () => {
    let volumeCallback = null;
    let volumeInterval = null;
    const volumeVisualizer = document.getElementById('visualizer');
    const decibelText = document.getElementById('decibels');
    const startButton = document.getElementById('start');
    const stopButton = document.getElementById('stop');
    const tooLoudSound = new Audio('./assets/audio/evil_laugh.wav');
    const startSound = new Audio('./assets/audio/confirm.wav');
    const stopSound = new Audio('./assets/audio/pause.wav');
    const clickSound = new Audio('./assets/audio/click.wav');
    let threshold = 60;
    let thresholdExceeds = 0;
    const thresholdLabel = document.getElementById("threshold");
    const thresholdRange = document.getElementById("thresholdRange");
    thresholdLabel.innerText = threshold;
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
        if(Math.round(averageVolume * 100 / 127) > threshold){
            document.body.style.backgroundColor = "red";
            thresholdExceeds++;
            document.getElementById("thresholdExcess").innerText = thresholdExceeds;
            tooLoudSound.play();
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

    document.getElementById("downThreshold").addEventListener('click', () => {
      clickSound.currentTime = 0;
      clickSound.play();
      threshold--;
      thresholdLabel.innerText = threshold;
      thresholdRange.value = threshold;
    })
    document.getElementById("upThreshold").addEventListener('click', () => {
      clickSound.currentTime = 0;
      clickSound.play();
      threshold++;
      thresholdLabel.innerText = threshold;
      thresholdRange.value = threshold;
    })
    thresholdRange.addEventListener('change', () => {
      threshold = thresholdRange.value;
      thresholdLabel.innerText = threshold;
    })
    // Use
    startButton.addEventListener('click', () => {
      startSound.play();
      // Updating every 100ms (should be same as CSS transition speed)
      if(volumeCallback !== null && volumeInterval === null)
        volumeInterval = setInterval(volumeCallback, 100);
    });
    stopButton.addEventListener('click', () => {
      stopSound.play();
      if(volumeInterval !== null) {
        clearInterval(volumeInterval);
        volumeInterval = null;
      }
    });
  })();