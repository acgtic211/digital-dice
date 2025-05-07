module.exports = function (
  knobLabel = "Dimmer",
  requestUrl = "https://localhost:30001/acg:lab:suitcase-dd",
  actionName = "switch-dimmer1",     // Ya no se usará para URL, solo para información
  propertyName = "luminosity-dimmer1" // Se usará esta URL tanto para GET como para POST
) {
  return `
    <div class="dimmer-component" data-action="${actionName}" data-property="${propertyName}">
      <div class="dimmer-label">${knobLabel}</div>
      <div class="slider-container">
        <div class="dimmer-value" id="${propertyName}-value">0%</div>
        <input type="range" min="0" max="100" value="0" class="dimmer-slider" id="${propertyName}-slider">
      </div>
      <div class="dimmer-status" id="${propertyName}-status">Cargando...</div>
      
      <script>
        (function() {
          // Elementos DOM - se buscan solo dentro de este componente específico
          var componentElement = document.currentScript.closest('.dimmer-component');
          var slider = componentElement.querySelector('.dimmer-slider');
          var valueDisplay = componentElement.querySelector('.dimmer-value');
          var statusDisplay = componentElement.querySelector('.dimmer-status');
          
          // Variables de estado
          var isProcessing = false;
          var userDragging = false;
          var isInitialized = false;
          var hasSentDefaultValue = false;
          var intentosConsecutivosVacios = 0;
          
          // Solo usamos una URL para todo (property)
          var propertyUrl = '${requestUrl}/property/${propertyName}';
          
          console.log('[${propertyName}] Configurando dimmer con URL:', propertyUrl);
          
          // Actualizar UI del dimmer
          function updateUI(value) {
            // Solo actualizar si no está siendo manipulado por el usuario
            if (userDragging) return;
            
            value = parseInt(value) || 0;
            slider.value = value;
            valueDisplay.textContent = value + "%";
            
            // Actualizar degradado del slider
            var percent = value;
            slider.style.background = 'linear-gradient(to right, #35BC7A ' + percent + '%, #d3d3d3 ' + percent + '%)';
            
            // Actualizar estado
            statusDisplay.textContent = "OK";
            isInitialized = true;
            console.log('[${propertyName}] UI actualizada a:', value);
          }
          
          // Inicializar valor en la base de datos SOLO si realmente no existe
          function initializeValueInDB(defaultValue) {
            // No inicializar si ya hemos enviado un valor por defecto
            if (hasSentDefaultValue) {
              return;
            }
            
            // Solo inicializar después de múltiples intentos consecutivos fallidos
            if (intentosConsecutivosVacios < 3) {
              return;
            }
            
            hasSentDefaultValue = true;
            
            console.log('[${propertyName}] Inicializando valor en la base de datos después de ' + 
                       intentosConsecutivosVacios + ' intentos fallidos:', defaultValue);
            
            // Ahora usamos la misma URL (property) pero con método POST para actualizar
            fetch(propertyUrl, {
              method: 'POST',  // Usando POST para actualizar el recurso
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({brightness: defaultValue})
            })
            .then(function(response) {
              console.log('[${propertyName}] Valor predeterminado enviado correctamente');
            })
            .catch(function(err) {
              console.error("[${propertyName}] Error enviando valor predeterminado:", err);
            });
          }
          
          // Obtener luminosidad desde API (forzar llamada directa)
          function getBrightness() {
            if (isProcessing || userDragging) return;
            
            console.log('[${propertyName}] Obteniendo brillo desde:', propertyUrl);
            
            // Usar credentials: 'include' y forzar no-cache para evitar problemas de caché
            fetch(propertyUrl, { 
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              },
              cache: 'no-store'
            })
            .then(function(response) {
              if (!response.ok) {
                console.warn('[${propertyName}] Error API al obtener brillo:', response.status);
                intentosConsecutivosVacios++;
                return;
              }
              return response.text();
            })
            .then(function(text) {
              // Manejar respuestas vacías o nulas
              if (!text || text.trim() === '') {
                console.log('[${propertyName}] Respuesta API vacía');
                intentosConsecutivosVacios++;
                
                // Solo después de varios intentos fallidos consideramos inicializar con valor por defecto
                if (intentosConsecutivosVacios >= 3 && !isInitialized) {
                  console.log('[${propertyName}] Múltiples respuestas vacías, usando valor por defecto');
                  updateUI(0);
                  initializeValueInDB(0);
                }
                return;
              }
              
              try {
                var data = JSON.parse(text);
                console.log('[${propertyName}] Datos recibidos:', data);
                
                // Resetear contador de intentos vacíos porque recibimos algo
                intentosConsecutivosVacios = 0;
                
                // Comprobar si el objeto tiene datos en la estructura esperada
                if (data && typeof data === 'object') {
                  // La API podría devolver brightness o value
                  if (typeof data.brightness !== 'undefined') {
                    // ¡DATOS EXISTENTES! Actualizar UI
                    updateUI(data.brightness);
                    console.log('[${propertyName}] Usando datos existentes (brightness):', data.brightness);
                  } else if (typeof data.value !== 'undefined') {
                    // ¡DATOS EXISTENTES! Actualizar UI
                    updateUI(data.value);
                    console.log('[${propertyName}] Usando datos existentes (value):', data.value);
                  } else if (data.data && typeof data.data.brightness !== 'undefined') {
                    // A veces los datos pueden estar anidados en .data
                    updateUI(data.data.brightness);
                    console.log('[${propertyName}] Usando datos anidados:', data.data.brightness);
                  } else if (data.data && typeof data.data.value !== 'undefined') {
                    // A veces los datos pueden estar anidados en .data con value
                    updateUI(data.data.value);
                    console.log('[${propertyName}] Usando datos anidados (value):', data.data.value);
                  } else {
                    // JSON válido pero sin brightness/value
                    intentosConsecutivosVacios++;
                    
                    console.log('[${propertyName}] Estructura de datos recibida:', Object.keys(data));
                    
                    if (intentosConsecutivosVacios >= 3 && !isInitialized) {
                      console.log('[${propertyName}] Datos sin campos esperados, usando valor por defecto');
                      updateUI(0);
                      initializeValueInDB(0);
                    }
                  }
                } else {
                  console.warn('[${propertyName}] Datos no válidos:', data);
                  intentosConsecutivosVacios++;
                  
                  if (intentosConsecutivosVacios >= 3 && !isInitialized) {
                    console.log('[${propertyName}] Datos no válidos, usando valor por defecto');
                    updateUI(0);
                    initializeValueInDB(0);
                  }
                }
              } catch (e) {
                console.error('[${propertyName}] Error parseando respuesta:', e);
                console.error('[${propertyName}] Texto que causó error:', text);
                intentosConsecutivosVacios++;
                
                // Solo inicializar después de varios intentos fallidos
                if (intentosConsecutivosVacios >= 3 && !isInitialized) {
                  console.log('[${propertyName}] Error persistente al parsear, usando valor por defecto');
                  updateUI(0);
                  initializeValueInDB(0);
                }
              }
            })
            .catch(function(err) {
              console.error("[${propertyName}] Error obteniendo luminosidad:", err);
              intentosConsecutivosVacios++;
              
              // Solo inicializar después de varios intentos fallidos
              if (intentosConsecutivosVacios >= 3 && !isInitialized) {
                console.log('[${propertyName}] Error persistente de conexión, usando valor por defecto');
                updateUI(0);
                initializeValueInDB(0);
              }
            });
          }
          
          // Enviar cambio de brillo - ahora usando la misma URL de property con POST
          function sendBrightness(value) {
            if (isProcessing) return;
            isProcessing = true;
            
            value = parseInt(value) || 0;
            statusDisplay.textContent = "Actualizando...";
            
            console.log('[${propertyName}] Enviando brightness con valor:', value);
            
            // Usamos la misma URL para actualizar, con POST
            fetch(propertyUrl, {
              method: 'POST',  // POST para actualizar el recurso existente
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({brightness: value})
            })
            .then(function(response) {
              if (!response.ok) throw new Error('Error: ' + response.status);
              console.log('[${propertyName}] Brightness enviado correctamente');
              
              // Actualizar UI optimistamente
              updateUI(value);
              
              // Resetear contador de intentos vacíos porque sabemos que hay datos
              intentosConsecutivosVacios = 0;
              
              // Verificar estado un poco después
              setTimeout(function() {
                isProcessing = false;
                getBrightness();
              }, 500);
            })
            .catch(function(err) {
              console.error("[${propertyName}] Error enviando brillo:", err);
              statusDisplay.textContent = "Error";
              isProcessing = false;
              setTimeout(getBrightness, 1000);
            });
          }
          
          // Control de eventos para el slider - específicos para este componente
          slider.addEventListener('input', function() {
            valueDisplay.textContent = this.value + "%";
            var percent = this.value;
            this.style.background = 'linear-gradient(to right, #35BC7A ' + percent + '%, #d3d3d3 ' + percent + '%)';
          });
          
          // Control de arrastre inicio
          slider.addEventListener('mousedown', function() {
            userDragging = true;
          });
          slider.addEventListener('touchstart', function() {
            userDragging = true;
          });
          
          // Control de arrastre fin y envío
          slider.addEventListener('mouseup', function() {
            if (userDragging) {
              userDragging = false;
              sendBrightness(this.value);
            }
          });
          slider.addEventListener('touchend', function() {
            if (userDragging) {
              userDragging = false;
              sendBrightness(this.value);
            }
          });
          
          // Por si el mouse sale del slider durante el arrastre
          componentElement.addEventListener('mouseleave', function() {
            if (userDragging) {
              userDragging = false;
              sendBrightness(slider.value);
            }
          });
          
          // Enviar al cambiar (para enterkey y algunos dispositivos tactiles)
          slider.addEventListener('change', function() {
            if (!isProcessing) {
              sendBrightness(this.value);
            }
          });
          
          // Primera carga - obtener estado inmediatamente
          getBrightness();
          
          // Intentar una segunda vez tras un pequeño retraso
          setTimeout(function() {
            if (!isInitialized) {
              console.log('[${propertyName}] Segundo intento de obtención de datos...');
              getBrightness();
            }
          }, 1000);
          
          // Último intento con timeout más largo
          setTimeout(function() {
            if (!isInitialized && intentosConsecutivosVacios >= 3) {
              console.log('[${propertyName}] No se recibieron datos después de múltiples intentos, aplicando valor por defecto');
              updateUI(0);
              initializeValueInDB(0);
            }
          }, 3000);
          
          // Actualización periódica 
          var intervalId = setInterval(getBrightness, 3000);
          
          // Actualizar al volver a la página
          document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
              console.log('[${propertyName}] Página visible de nuevo, actualizando brillo');
              getBrightness();
            }
          });
          
          // Asegurar limpieza de intervalos al navegar
          window.addEventListener('beforeunload', function() {
            clearInterval(intervalId);
          });
        })();
      </script>
    </div>
  `;
};