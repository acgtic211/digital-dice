module.exports = function (
  switchLabel = "Switch",
  requestUrl = "https://localhost:30001/acg:lab:suitcase-dd",
  actionName = "switch-light1",    // Ya no se usará para URL, solo para información
  propertyName = "status-light1",  // Se usará esta URL tanto para GET como para PUT/POST
  imageSrc = "/assets/Switch1.png"
) {
  return `
    <div class="switch-component" data-action="${actionName}" data-property="${propertyName}">
      <div class="switch-image-container">
        <img src="${imageSrc}" alt="${switchLabel}" class="switch-image">
      </div>
      <div class="switch-label">${switchLabel}</div>
      <div class="switch-toggle">
        <input type="checkbox" id="${actionName}" class="switch-checkbox">
        <label for="${actionName}" class="switch-label-toggle"></label>
      </div>
      <div class="switch-status" id="${actionName}-status">Cargando...</div>
      
      <script>
        (function() {
          // Elementos DOM - se buscan solo dentro de este componente específico
          var componentElement = document.currentScript.closest('.switch-component');
          var checkbox = componentElement.querySelector('.switch-checkbox');
          var statusDisplay = componentElement.querySelector('.switch-status');
          
          // Variables de estado
          var isProcessing = false;
          var isInitialized = false;
          var hasSentDefaultValue = false;
          var intentosConsecutivosVacios = 0;
          
          // Solo usamos una URL para todo (property)
          var propertyUrl = '${requestUrl}/property/${propertyName}';
          
          console.log('[${propertyName}] Configurando switch con URL:', propertyUrl);
          
          // Actualizar UI
          function updateUI(isOn) {
            isOn = Boolean(isOn);
            checkbox.checked = isOn;
            statusDisplay.textContent = isOn ? "ENCENDIDO" : "APAGADO";
            statusDisplay.className = "switch-status " + (isOn ? "status-on" : "status-off");
            isInitialized = true;
            console.log('[${propertyName}] UI actualizada a:', isOn);
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
              body: JSON.stringify({value: defaultValue})
            })
            .then(function(response) {
              console.log('[${propertyName}] Valor predeterminado enviado correctamente');
            })
            .catch(function(err) {
              console.error("[${propertyName}] Error enviando valor predeterminado:", err);
            });
          }
          
          // Obtener estado desde API
          function getState() {
            if (isProcessing) return;
            
            console.log('[${propertyName}] Obteniendo estado desde:', propertyUrl);
            
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
                console.warn('[${propertyName}] Error API al obtener estado:', response.status);
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
                  updateUI(false);
                  initializeValueInDB(false);
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
                  if (typeof data.value !== 'undefined') {
                    // ¡DATOS EXISTENTES! Actualizar UI
                    updateUI(data.value);
                    console.log('[${propertyName}] Usando datos existentes:', data.value);
                  } else if (data.data && typeof data.data.value !== 'undefined') {
                    // A veces los datos pueden estar anidados en .data
                    updateUI(data.data.value);
                    console.log('[${propertyName}] Usando datos anidados:', data.data.value);
                  } else {
                    // JSON válido pero sin value
                    intentosConsecutivosVacios++;
                    
                    console.log('[${propertyName}] Estructura de datos recibida:', Object.keys(data));
                    
                    if (intentosConsecutivosVacios >= 3 && !isInitialized) {
                      console.log('[${propertyName}] Datos sin campos esperados, usando valor por defecto');
                      updateUI(false);
                      initializeValueInDB(false);
                    }
                  }
                } else {
                  console.warn('[${propertyName}] Datos no válidos:', data);
                  intentosConsecutivosVacios++;
                  
                  if (intentosConsecutivosVacios >= 3 && !isInitialized) {
                    console.log('[${propertyName}] Datos no válidos, usando valor por defecto');
                    updateUI(false);
                    initializeValueInDB(false);
                  }
                }
              } catch (e) {
                console.error('[${propertyName}] Error parseando respuesta:', e);
                console.error('[${propertyName}] Texto que causó error:', text);
                intentosConsecutivosVacios++;
                
                // Solo inicializar después de varios intentos fallidos
                if (intentosConsecutivosVacios >= 3 && !isInitialized) {
                  console.log('[${propertyName}] Error persistente al parsear, usando valor por defecto');
                  updateUI(false);
                  initializeValueInDB(false);
                }
              }
            })
            .catch(function(err) {
              console.error("[${propertyName}] Error obteniendo estado:", err);
              intentosConsecutivosVacios++;
              
              // Solo inicializar después de varios intentos fallidos
              if (intentosConsecutivosVacios >= 3 && !isInitialized) {
                console.log('[${propertyName}] Error persistente de conexión, usando valor por defecto');
                updateUI(false);
                initializeValueInDB(false);
              }
            });
          }
          
          // Cambiar estado - ahora usando la misma URL de property con POST
          function toggleState() {
            if (isProcessing) return;
            isProcessing = true;
            
            var newState = !checkbox.checked;
            statusDisplay.textContent = "Actualizando...";
            
            console.log('[${propertyName}] Enviando nuevo estado con valor:', newState);
            
            // Usamos la misma URL para actualizar, con POST
            fetch(propertyUrl, {
              method: 'POST',  // POST para actualizar el recurso existente
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({value: newState})
            })
            .then(function(response) {
              if (!response.ok) throw new Error('Error: ' + response.status);
              console.log('[${propertyName}] Estado enviado correctamente');
              
              // Actualizar UI optimistamente
              updateUI(newState);
              
              // Resetear contador de intentos vacíos porque sabemos que hay datos
              intentosConsecutivosVacios = 0;
              
              // Verificar estado un poco después
              setTimeout(function() {
                isProcessing = false;
                getState();
              }, 500);
            })
            .catch(function(err) {
              console.error("[${propertyName}] Error enviando estado:", err);
              statusDisplay.textContent = "Error";
              isProcessing = false;
              setTimeout(getState, 1000);
            });
          }
          
          // Asignamos los eventos SOLO dentro del componente actual
          componentElement.addEventListener('click', function(e) {
            var target = e.target;
            
            // Evitar toggle cuando se hace clic en partes no interactivas
            if (target.tagName === 'IMG') return;
            
            // Si fue en el checkbox, su label o en cualquier parte del componente
            if (!isProcessing && (
                target === checkbox || 
                target.htmlFor === '${actionName}' || 
                target.closest('label[for="${actionName}"]') ||
                target.closest('.switch-toggle')
            )) {
              e.preventDefault();
              e.stopPropagation();
              toggleState();
            }
          });
          
          // Primera carga - obtener estado inmediatamente
          getState();
          
          // Intentar una segunda vez tras un pequeño retraso
          setTimeout(function() {
            if (!isInitialized) {
              console.log('[${propertyName}] Segundo intento de obtención de datos...');
              getState();
            }
          }, 1000);
          
          // Último intento con timeout más largo
          setTimeout(function() {
            if (!isInitialized && intentosConsecutivosVacios >= 3) {
              console.log('[${propertyName}] No se recibieron datos después de múltiples intentos, aplicando valor por defecto');
              updateUI(false);
              initializeValueInDB(false);
            }
          }, 3000);
          
          // Actualización periódica
          var intervalId = setInterval(getState, 3000);
          
          // Actualizar al volver a la página
          document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
              console.log('[${propertyName}] Página visible de nuevo, actualizando estado');
              getState();
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