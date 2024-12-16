module.exports = function (
  dimmerLabel = "Dimmer",
  requestUrl = "https://acg.ual.es/things/acg:lab:suitcase-dd",
  action = "switch-dimmer1",
  property = "luminosity-dimmer1"
) {
  const dimmerId = dimmerLabel.replace(/\s+/g, '-').toLowerCase(); // Generar un ID único basado en el label

  return `
    <div class="dimmerContainer">
      <input class="dimmerSlider" type="range" min="0" max="100" id="${dimmerId}" value="0">
      <label class="sliderLabel">${dimmerLabel}: <span id="${dimmerId}Value">0</span></label>
    </div>
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const dimmerElement = document.querySelector('#${dimmerId}');
        const dimmerValueElement = document.querySelector('#${dimmerId}Value');

         document.querySelectorAll('.dimmerSlider').forEach(slider => {
          // Establece el estilo de fondo inicial al cargar la página
          const initialValue = (slider.value - slider.min) / (slider.max - slider.min) * 100;
          slider.style.background = 'linear-gradient(to right, #35BC7A ' + initialValue + '%, #d3d3d3 ' + initialValue + '%)';

          // Actualiza el fondo dinámicamente cuando se mueve el slider
          slider.addEventListener('input', function () {
            const value = (this.value - this.min) / (this.max - this.min) * 100;
            this.style.background = 'linear-gradient(to right, #35BC7A ' + value + '%, #d3d3d3 ' + value + '%)';
          });
        });


        const apiUrl = '${requestUrl}';

        // SSE connection for dimmer
        const eventSource = new EventSource(\`\${apiUrl}/status/sse\`);
        eventSource.addEventListener('message', (event) => {
          const data = JSON.parse(event.data);
          console.log('SSE Message:', data);

          if (data.interaction === 'property.${property}') {
            dimmerElement.value = data.data.brightness;
            dimmerValueElement.textContent = data.data.brightness;
          }
        });

        // Event handler for dimmer (on input)
        dimmerElement.addEventListener('input', () => {
          const value = dimmerElement.value;
          dimmerValueElement.textContent = value;
          console.log(\`${dimmerId} changed:\`, value);
          fetch(\`\${apiUrl}/action/${action}/\`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ brightness: value })
          })
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then(data => console.log('Response:', data))
          .catch(error => console.error('Error:', error));
        });
      });
    </script>
  `;
};