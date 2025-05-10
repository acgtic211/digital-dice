module.exports = function (
  switchLabel = "Switch",
  requestUrl = "https://acg.ual.es/things/acg:lab:suitcase-dd",
  action = "switch-light1",
  imageSrc = "/assets/Switch1.png",
  property = "status-light1"
) {
  const switchId = switchLabel.replace(/\s+/g, '-').toLowerCase(); // Generar un ID único basado en el label

  return `
    <div class="switchContainer">
      <img src="${imageSrc}" alt='${switchLabel}'>
      <label class="switchLabel">${switchLabel}</label>
      <label class="switch">
        <input type="checkbox" id="${switchId}" v-model="${switchId}">
        <span class="slider round"></span>
      </label>
    </div>
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const switchElement = document.querySelector('#${switchId}');

        const apiUrl = '${requestUrl}';

        // Event handler for switch (on click)
        switchElement.addEventListener('click', () => {
          const value = switchElement.checked;
          console.log(\`${switchId} clicked:\`, value);
          fetch(\`\${apiUrl}/action/${action}/\`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ value: value })
          })
          .then(response => response.json())
          .then(data => console.log('Response:', data))
          .catch(error => console.error('Error:', error));
        });
      });
    </script>
  `;
};