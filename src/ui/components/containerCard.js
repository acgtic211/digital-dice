/**
 * Componente de tarjeta para mostrar información de contenedores
 * @param {Object} containerData - Datos del contenedor
 * @param {string} containerData.serialNumber - Número de serie del contenedor
 * @param {number} containerData.capacity - Capacidad actual del contenedor
 * @param {number} containerData.maxCapacity - Capacidad máxima del contenedor
 * @param {string} containerData.address - Dirección del contenedor
 * @param {number} containerData.temperature - Temperatura actual del contenedor
 * @param {string} containerData.garbageClass - Tipo de residuo (recycling, paper, organic, etc.)
 * @param {boolean} containerData.expanded - Si debe mostrar información detallada o no
 * @returns {string} HTML del componente
 */
function containerCardComponent(containerData) {
  const {
    serialNumber,
    capacity,
    maxCapacity,
    address,
    temperature,
    garbageClass,
    expanded = false
  } = containerData;
  
  // Calcular porcentaje de capacidad
  const capacityPercentage = Math.floor((capacity / maxCapacity) * 100);
  
  // Determinar el color basado en la clase de residuo
  const garbageColor = getGarbageColor(garbageClass);
  
  // Determinar el icono de la clase de residuo
  const garbageIcon = getGarbageIcon(garbageClass);
  
  // Crear un ID único para esta tarjeta
  const cardId = `container-card-${serialNumber}`;
  
  // Construir la estructura HTML del componente
  return `
    <div id="${cardId}" class="container-card" data-serial="${serialNumber}" data-expanded="${expanded}">
      <div class="container-header">
        <div class="container-info">
          <div class="info-row">
            <div class="info-label">SERIAL NUMBER:</div>
            <div class="info-value">${serialNumber}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">CAPACITY:</div>
            <div class="info-value">${capacity.toFixed(2)}/${maxCapacity}</div>
          </div>
          
          <div class="expanded-info" style="display: ${expanded ? 'block' : 'none'}">
            <div class="info-row">
              <div class="info-label">ADDRESS:</div>
              <div class="info-value">${address}</div>
            </div>
            
            <div class="info-row">
              <div class="info-label">TEMPERATURE:</div>
              <div class="info-value">${temperature}</div>
            </div>
          </div>
        </div>
        
        <div class="capacity-indicator">
          <div class="capacity-value">${capacityPercentage}</div>
        </div>
      </div>
      
      <div class="container-footer">
        <div class="garbage-class">
          <div class="garbage-label" style>GARBAGE<br>CLASS:</div>
          <div class="garbage-icon ${garbageColor}">${garbageIcon}</div>
        </div>
        
        <button class="container-action-btn">
          ${expanded ? 'CLOSE' : 'MORE INFO'}
        </button>
      </div>
    </div>
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const card = document.getElementById('${cardId}');
        const actionButton = card.querySelector('.container-action-btn');
        const expandedInfo = card.querySelector('.expanded-info');
        
        if (actionButton && expandedInfo) {
          actionButton.addEventListener('click', () => {
            // Obtener el estado actual
            const isExpanded = card.getAttribute('data-expanded') === 'true';
            
            // Cambiar el estado
            const newExpandedState = !isExpanded;
            card.setAttribute('data-expanded', newExpandedState);
            
            // Mostrar u ocultar información expandida
            expandedInfo.style.display = newExpandedState ? 'block' : 'none';
            
            // Cambiar el texto del botón
            actionButton.textContent = newExpandedState ? 'CLOSE' : 'MORE INFO';
            
            // Animar la transición
            if (newExpandedState) {
              expandedInfo.style.maxHeight = '0';
              setTimeout(() => {
                expandedInfo.style.maxHeight = expandedInfo.scrollHeight + 'px';
              }, 10);
            } else {
              expandedInfo.style.maxHeight = '0';
            }
          });
        }
      });
    </script>
  `;
}

/**
 * Obtiene el color asociado al tipo de residuo
 * @param {string} garbageClass - Tipo de residuo
 * @returns {string} Clase CSS para el color
 */
function getGarbageColor(garbageClass) {
  // Mapeo de clases de residuos a colores
  const classToColor = {
    'organic': 'green',
    'paper': 'blue',
    'plastic': 'yellow'
  };
  
  return classToColor[garbageClass.toLowerCase()] || 'gray';
}

/**
 * Obtiene el icono HTML para el tipo de residuo
 * @param {string} garbageClass - Tipo de residuo
 * @returns {string} HTML del icono con imagen
 */
function getGarbageIcon(garbageClass) {
  // Mapeo de clases de residuos a rutas de imagen
  const classToImage = {
    'paper': '/assets/paper.png',
    'organic': '/assets/organic.png',
    'plastic': '/assets/plastic.png'
  };
  
  // Obtener la ruta de la imagen basada en la clase, o usar un icono predeterminado
  const imagePath = classToImage[garbageClass.toLowerCase()] || '/assets/general-waste-icon.png';
  
  // Devolver el HTML para la imagen
  return `<img src="${imagePath}" alt="${garbageClass}" width="24" height="24">`;
}

module.exports = containerCardComponent;