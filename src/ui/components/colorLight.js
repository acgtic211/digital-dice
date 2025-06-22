const colorLight = (lightId = "colorlight_1:acg:lab", baseUrl = "http://localhost:8063") => {
  // Usamos las variables directamente dentro del template literal
  // para evitar problemas de interpolación
  const apiUrl = `${baseUrl}/${lightId}`;
  
  return `
    <div class="color-light-container">
      <div class="mode-selectors">
        <button class="mode-button active" data-mode="hs">HS</button>
        <button class="mode-button" data-mode="xy">XY</button>
        <button class="mode-button" data-mode="ct">CT</button>
      </div>
      
      <div class="color-controls">
        <!-- Color Space (HS/XY) -->
        <div class="color-panel" id="color-panel-hs-xy">
          <div class="color-label" id="current-color-label">Color Space:</div>
          <div class="color-picker" id="color-picker">
            <div class="color-picker-thumb" id="color-picker-thumb"></div>
          </div>
        </div>
        
        <!-- Color Temperature -->
        <div class="color-panel" id="color-panel-ct" style="display: none;">
          <div class="color-label">Color Temperature:</div>
          <div class="color-temp-slider">
            <div class="color-temp-track"></div>
            <input type="range" id="color-temp-control" min="0" max="65279" value="4500" />
          </div>
        </div>
        
        <!-- Hue controls for HS mode -->
        <div class="color-panel" id="color-panel-hue" style="display: none;">
          <div class="color-label">HUE:</div>
          <div class="hue-wheel">
            <input type="range" id="hue-control" min="0" max="65535" value="21845" />
          </div>
          <div class="color-label">Saturation:</div>
          <div class="saturation-slider">
            <input type="range" id="saturation-control" min="0" max="254" value="127" />
          </div>
        </div>
      </div>
      
      <div class="light-controls">
        <div class="light-icon" id="light-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M45,10 C25,10 15,25 15,40 C15,55 25,65 35,70 L35,85 C35,90 40,95 50,95 C60,95 65,90 65,85 L65,70 C75,65 85,55 85,40 C85,25 65,10 45,10 Z" stroke="black" stroke-width="4" fill="currentColor" />
            <path d="M35,75 L65,75 M35,85 L65,85" stroke="black" stroke-width="3" fill="none" />
            <path d="M30,35 L15,20 M70,35 L85,20 M50,15 L50,0 M25,50 L10,50 M75,50 L90,50" stroke="black" stroke-width="3" fill="none" />
          </svg>
        </div>
        <div class="toggle-control">
          <button class="toggle-button" id="toggle-button">OFF</button>
        </div>
      </div>
      
      <div class="brightness-control">
        <div class="brightness-label">Brightness:</div>
        <div class="brightness-slider">
          <input type="range" id="brightness-control" min="0" max="254" value="127" />
        </div>
      </div>
      
      <div class="alert-control">
        <select id="alert-select">
          <option value="">Select alert</option>
          <option value="none">None</option>
          <option value="select">Select (Fast flash)</option>
          <option value="lselect">Long Select (Slow flash)</option>
          <option value="blink">Blink once</option>
          <option value="stop">Stop alerts</option>
        </select>
      </div>
      
      <div class="connection-status" id="connection-status">
        <span class="status-indicator"></span>
        <span class="status-text">Connected</span>
      </div>

      <div class="color-info">
        <div id="current-mode">Mode: hs</div>
        <div id="current-color">Selected: #FF0000</div>
      </div>
    </div>
    
    <script>
      (function() {
        // Configuration
        const API_URL = "${apiUrl}";
        
        // DOM elements - Use try/catch to handle potential null elements
        let colorPickerEl, colorPickerThumb, modeButtons, colorPanelHsXy, colorPanelCt;
        let colorPanelHue, colorTempControl, hueControl, saturationControl, brightnessControl;
        let alertSelect, lightIcon, toggleButton, colorLabel, currentModeDisplay;
        let currentColorDisplay, connectionStatus;

        try {
          colorPickerEl = document.getElementById('color-picker');
          colorPickerThumb = document.getElementById('color-picker-thumb');
          modeButtons = document.querySelectorAll('.mode-button');
          colorPanelHsXy = document.getElementById('color-panel-hs-xy');
          colorPanelCt = document.getElementById('color-panel-ct');
          colorPanelHue = document.getElementById('color-panel-hue');
          colorTempControl = document.getElementById('color-temp-control');
          hueControl = document.getElementById('hue-control');
          saturationControl = document.getElementById('saturation-control');
          brightnessControl = document.getElementById('brightness-control');
          alertSelect = document.getElementById('alert-select');
          lightIcon = document.getElementById('light-icon');
          toggleButton = document.getElementById('toggle-button');
          colorLabel = document.getElementById('current-color-label');
          currentModeDisplay = document.getElementById('current-mode');
          currentColorDisplay = document.getElementById('current-color');
          connectionStatus = document.getElementById('connection-status');
        } catch (e) {
          console.error("Error initializing DOM elements:", e);
          return;
        }
        
        // State variables
        let currentMode = 'hs'; // Default mode
        let isOn = false; // Start with light off
        let currentHue = 21845;
        let currentSaturation = 127;
        let currentBrightness = 127;
        let currentXY = [0.5, 0.5];
        let currentColorTemp = 4500;
        let isReachable = true;
        let eventSources = {}; // Track active EventSource instances
        
        // Initialize UI
        updateModeUI(currentMode);
        updateLightIcon();
        
        // Event listeners for mode buttons
        modeButtons.forEach(button => {
          button.addEventListener('click', () => {
            try {
              const mode = button.dataset.mode;
              setMode(mode);
            } catch (e) {
              console.error("Error in mode button click:", e);
            }
          });
        });
        
        // Initialize XY color picker
        colorPickerEl.addEventListener('click', (e) => {
          try {
            const rect = colorPickerEl.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = 1 - (e.clientY - rect.top) / rect.height;
            setXYColor(x, y);
          } catch (e) {
            console.error("Error in color picker click:", e);
          }
        });
        
        // Temperature slider
        colorTempControl.addEventListener('input', () => {
          try {
            currentColorTemp = parseInt(colorTempControl.value);
            callAction('setColorTemperature', { colorTemperature: currentColorTemp });
          } catch (e) {
            console.error("Error in temperature control:", e);
          }
        });
        
        // Hue and Saturation controls
        hueControl.addEventListener('input', () => {
          try {
            currentHue = parseInt(hueControl.value);
            callAction('setHue', { hue: currentHue });
            updateColorFromHueSat();
          } catch (e) {
            console.error("Error in hue control:", e);
          }
        });
        
        saturationControl.addEventListener('input', () => {
          try {
            currentSaturation = parseInt(saturationControl.value);
            callAction('setSaturation', { saturation: currentSaturation });
            updateColorFromHueSat();
          } catch (e) {
            console.error("Error in saturation control:", e);
          }
        });
        
        // Brightness control
        brightnessControl.addEventListener('input', () => {
          try {
            currentBrightness = parseInt(brightnessControl.value);
            callAction('setBrightness', { brightness: currentBrightness });
            updateLightIcon();
          } catch (e) {
            console.error("Error in brightness control:", e);
          }
        });
        
        // Alert selector
        alertSelect.addEventListener('change', () => {
          try {
            const alertValue = alertSelect.value;
            if (alertValue) {
              callAction('alert', { alertProperty: alertValue });
              
              // Reset dropdown after a moment
              setTimeout(() => {
                alertSelect.selectedIndex = 0;
              }, 2000);
            }
          } catch (e) {
            console.error("Error in alert selector:", e);
          }
        });
        
        // Toggle button
        toggleButton.addEventListener('click', () => {
          try {
            isOn = !isOn;
            callAction('setStatus', { status: isOn });
            updateLightIcon();
            toggleButton.textContent = isOn ? 'ON' : 'OFF';
            toggleButton.classList.toggle('toggle-on', isOn);
            toggleButton.classList.toggle('toggle-off', !isOn);
          } catch (e) {
            console.error("Error in toggle button:", e);
          }
        });
        
        // Helper functions
        function setMode(mode) {
          if (!mode) return;
          
          currentMode = mode;
          updateModeUI(mode);
          
          // Highlight the selected mode button
          modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
          });
          
          if (mode === 'hs' || mode === 'xy') {
            if (mode === 'hs') {
              colorLabel.textContent = 'Color Space:';
            } else {
              colorLabel.textContent = 'XY Space:';
            }
          }
          
          currentModeDisplay.textContent = 'Mode: ' + mode;
        }
        
        function updateModeUI(mode) {
          // Show/hide appropriate controls based on mode
          if (!mode) return;
          
          colorPanelHsXy.style.display = (mode === 'hs' || mode === 'xy') ? 'block' : 'none';
          colorPanelCt.style.display = mode === 'ct' ? 'block' : 'none';
          colorPanelHue.style.display = mode === 'hs' ? 'block' : 'none';
        }
        
        function updateColorFromHueSat() {
          try {
            // Convert HSV to RGB
            const h = currentHue / 65535;
            const s = currentSaturation / 254;
            const v = 1;
            
            // Calculate the color
            let r, g, b;
            const i = Math.floor(h * 6);
            const f = h * 6 - i;
            const p = v * (1 - s);
            const q = v * (1 - f * s);
            const t = v * (1 - (1 - f) * s);
            
            switch (i % 6) {
              case 0: r = v; g = t; b = p; break;
              case 1: r = q; g = v; b = p; break;
              case 2: r = p; g = v; b = t; break;
              case 3: r = p; g = q; b = v; break;
              case 4: r = t; g = p; b = v; break;
              case 5: r = v; g = p; b = q; break;
              default: r = v; g = 0; b = 0; // Default to red
            }
            
            const hexColor = rgbToHex(r * 255, g * 255, b * 255);
            currentColorDisplay.textContent = 'Selected: ' + hexColor;
            updateLightIcon(hexColor);
          } catch (e) {
            console.error("Error updating color from hue/sat:", e);
          }
        }
        
        function rgbToHex(r, g, b) {
          return '#' + [r, g, b].map(x => {
            const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          }).join('');
        }
        
        function setXYColor(x, y) {
          try {
            // Clamp values to valid range
            x = Math.max(0, Math.min(1, x));
            y = Math.max(0, Math.min(1, y));
            
            // Update the thumb position
            colorPickerThumb.style.left = (x * 100) + '%';
            colorPickerThumb.style.bottom = (y * 100) + '%';
            
            currentXY = [x, y];
            callAction('setXYColorSpace', { x: x, y: y });
            
            // Show the currently selected color
            const rgb = xyToRgb(x, y);
            const hexColor = rgbToHex(rgb[0], rgb[1], rgb[2]);
            currentColorDisplay.textContent = 'Selected: ' + hexColor;
            updateLightIcon(hexColor);
          } catch (e) {
            console.error("Error setting XY color:", e);
          }
        }
        
        function xyToRgb(x, y) {
          try {
            // Prevent division by zero
            if (y === 0) y = 0.00001;
            
            const z = 1.0 - x - y;
            const Y = 1.0;
            const X = (Y / y) * x;
            const Z = (Y / y) * z;
            
            // Convert to RGB using the standard matrix
            let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
            let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
            let b = X * 0.051713 - Y * 0.121364 + Z * 1.011530;
            
            // Ensure values are positive
            r = Math.max(0, r);
            g = Math.max(0, g);
            b = Math.max(0, b);
            
            // Apply gamma correction
            r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055;
            g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055;
            b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055;
            
            return [
              Math.max(0, Math.min(255, Math.round(r * 255))),
              Math.max(0, Math.min(255, Math.round(g * 255))),
              Math.max(0, Math.min(255, Math.round(b * 255)))
            ];
          } catch (e) {
            console.error("Error in xy to RGB conversion:", e);
            return [255, 0, 0]; // Default to red in case of error
          }
        }
        
        function updateLightIcon(color) {
          try {
            // Update the light icon's color
            if (!isOn) {
              lightIcon.style.color = 'transparent';
              lightIcon.classList.remove('light-on');
              lightIcon.classList.add('light-off');
            } else {
              lightIcon.style.color = color || getBrightnessColor();
              lightIcon.classList.add('light-on');
              lightIcon.classList.remove('light-off');
            }
          } catch (e) {
            console.error("Error updating light icon:", e);
          }
        }
        
        function getBrightnessColor() {
          // Returns a color based on the brightness when no specific color is set
          const intensity = Math.round(currentBrightness / 254 * 255);
          return "rgb(" + intensity + "," + intensity + "," + intensity + ")";
        }
        
        function callAction(action, data) {
          try {
            fetch(API_URL + "/action/" + action, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            })
            .then(response => {
              if (!response.ok) throw new Error('Action failed');
              return response.json();
            })
            .then(data => {
              console.log('Action successful:', data);
            })
            .catch(error => {
              console.error("Error calling action " + action + ":", error);
              showConnectionError();
            });
          } catch (e) {
            console.error("Exception in callAction " + action + ":", e);
            showConnectionError();
          }
        }
        
        function showConnectionError() {
          try {
            connectionStatus.querySelector('.status-indicator').classList.add('disconnected');
            connectionStatus.querySelector('.status-text').textContent = 'Disconnected';
            isReachable = false;
          } catch (e) {
            console.error("Error showing connection error:", e);
          }
        }
        
        function fetchInitialState() {
          try {
            Promise.all([
              fetch(API_URL + "/property/status").then(r => r.json()).catch(() => false),
              fetch(API_URL + "/property/brightness").then(r => r.json()).catch(() => 127),
              fetch(API_URL + "/property/hue").then(r => r.json()).catch(() => 21845),
              fetch(API_URL + "/property/saturation").then(r => r.json()).catch(() => 127),
              fetch(API_URL + "/property/colorMode").then(r => r.json()).catch(() => 'hs'),
              fetch(API_URL + "/property/colorTemperature").then(r => r.json()).catch(() => 4500),
              fetch(API_URL + "/property/xyColorSpace").then(r => r.json()).catch(() => [0.5, 0.5]),
              fetch(API_URL + "/property/reachable").then(r => r.json()).catch(() => false)
            ]).then(([status, brightness, hue, saturation, colorMode, colorTemp, xyColorSpace, reachable]) => {
              // Update UI with fetched state
              isOn = status;
              currentBrightness = brightness;
              currentHue = hue;
              currentSaturation = saturation;
              currentMode = colorMode || 'hs';
              currentColorTemp = colorTemp;
              currentXY = xyColorSpace;
              isReachable = reachable;
              
              // Update UI controls
              brightnessControl.value = currentBrightness;
              hueControl.value = currentHue;
              saturationControl.value = currentSaturation;
              colorTempControl.value = currentColorTemp;
              
              // Update the XY picker thumb position
              colorPickerThumb.style.left = (currentXY[0] * 100) + '%';
              colorPickerThumb.style.bottom = (currentXY[1] * 100) + '%';
              
              // Set the UI mode
              setMode(currentMode);
              
              // Update the toggle button
              toggleButton.textContent = isOn ? 'ON' : 'OFF';
              toggleButton.classList.toggle('toggle-on', isOn);
              toggleButton.classList.toggle('toggle-off', !isOn);
              
              // Update the light icon
              updateLightIcon();
              
              // Update connection status
              connectionStatus.querySelector('.status-indicator').classList.toggle('disconnected', !isReachable);
              connectionStatus.querySelector('.status-text').textContent = isReachable ? 'Connected' : 'Disconnected';
            }).catch(error => {
              console.error('Error fetching initial state:', error);
              showConnectionError();
            });
          } catch (e) {
            console.error("Exception in fetchInitialState:", e);
            showConnectionError();
          }
        }
        
        // Setup Server-Sent Events for real-time updates
        function setupSSE() {
          const propertiesToWatch = [
            'status', 'brightness', 'colorMode', 'hue', 
            'saturation', 'colorTemperature', 'xyColorSpace', 'reachable'
          ];
          
          propertiesToWatch.forEach(prop => {
            try {
              // Close existing connection if any
              if (eventSources[prop]) {
                eventSources[prop].close();
              }
              
              const eventSource = new EventSource(API_URL + "/property/" + prop + "/sse");
              eventSources[prop] = eventSource;
              
              eventSource.onmessage = (event) => {
                try {
                  const data = JSON.parse(event.data);
                  
                  switch(prop) {
                    case 'status':
                      isOn = data;
                      toggleButton.textContent = isOn ? 'ON' : 'OFF';
                      toggleButton.classList.toggle('toggle-on', isOn);
                      toggleButton.classList.toggle('toggle-off', !isOn);
                      break;
                    case 'brightness':
                      currentBrightness = data;
                      brightnessControl.value = currentBrightness;
                      break;
                    case 'colorMode':
                      if (data !== currentMode) {
                        setMode(data);
                      }
                      break;
                    case 'hue':
                      currentHue = data;
                      hueControl.value = currentHue;
                      if (currentMode === 'hs') {
                        updateColorFromHueSat();
                      }
                      break;
                    case 'saturation':
                      currentSaturation = data;
                      saturationControl.value = currentSaturation;
                      if (currentMode === 'hs') {
                        updateColorFromHueSat();
                      }
                      break;
                    case 'colorTemperature':
                      currentColorTemp = data;
                      colorTempControl.value = currentColorTemp;
                      break;
                    case 'xyColorSpace':
                      currentXY = data;
                      colorPickerThumb.style.left = (currentXY[0] * 100) + '%';
                      colorPickerThumb.style.bottom = (currentXY[1] * 100) + '%';
                      if (currentMode === 'xy') {
                        const rgb = xyToRgb(currentXY[0], currentXY[1]);
                        const hexColor = rgbToHex(rgb[0], rgb[1], rgb[2]);
                        currentColorDisplay.textContent = 'Selected: ' + hexColor;
                        updateLightIcon(hexColor);
                      }
                      break;
                    case 'reachable':
                      isReachable = data;
                      connectionStatus.querySelector('.status-indicator').classList.toggle('disconnected', !isReachable);
                      connectionStatus.querySelector('.status-text').textContent = isReachable ? 'Connected' : 'Disconnected';
                      break;
                  }
                  
                  updateLightIcon();
                } catch (e) {
                  console.error("Error handling SSE message for " + prop + ":", e);
                }
              };
              
              eventSource.onerror = () => {
                console.error("SSE error for " + prop);
                eventSource.close();
                delete eventSources[prop];
                
                // Show connection error
                showConnectionError();
              };
            } catch (e) {
              console.error("Error setting up SSE for " + prop + ":", e);
            }
          });
        }
        
        // Cleanup function for SSE connections
        function cleanupSSE() {
          Object.values(eventSources).forEach(es => {
            try {
              if (es) es.close();
            } catch (e) {
              console.error("Error closing EventSource:", e);
            }
          });
          eventSources = {};
        }
        
        // Add event listener for page unload to clean up connections
        window.addEventListener('beforeunload', cleanupSSE);
        
        // Fetch initial state when component loads
        fetchInitialState();
        
        // Setup real-time updates with a slight delay to ensure the DOM is fully initialized
        setTimeout(setupSSE, 500);
      })();
    </script>
  `;
};

module.exports = colorLight;