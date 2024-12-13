module.exports = function (
  dimmerLabel = "Dimmer",
  requestUrl = "https://acg.ual.es/things/acg:lab:suitcase-dd",
  property = "luminosity-dimmer1"
) {
  return `
    <div class="sliderContainer">
      <input class="dimmerSlider" type="range" min="0" max="100" id="dimmer1" value="0">
      <label class="sliderLabel">${dimmerLabel}: <span id="dimmer1Value">0</span></label>
    </div>
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const dimmer1 = document.querySelector('#dimmer1');
        const dimmer1Value = document.querySelector('#dimmer1Value');

        const apiUrl = '${requestUrl}';

        // Event handler for dimmer1 (on change)
        dimmer1.addEventListener('input', () => {
          const value = dimmer1.value;
          dimmer1Value.textContent = value;
          console.log(\`dimmer1 changed:\`, value);
          fetch(\`\${apiUrl}/action/switch-dimmer1/\`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ brightness: value })
          })
          .then(response => response.json())
          .then(data => console.log('Response:', data))
          .catch(error => console.error('Error:', error));
        });
      });
    </script>
  `;
};