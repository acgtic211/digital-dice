module.exports = function (

) {

  return `
     <div class="gbgContainersScenarioContainer">
        <div class="containersView">
          <aside class="filtersWrapper">
            <div class="containersFilters">
              <div class="headerText">FILTER CONTAINERS</div>
              <div class="garbClsContainer">
                <div class="garbClsHeader">Garbage Class:</div>
                <div class="garbClsTypes">
                  <section class="garbClsOption">
                    <input type="checkbox" id="plasticCheck" name="plastic" value="plastic" class="garbClsCheckbox">
                    <label for="plasticCheck">Plastic</label>
                  </section>
                  <section class="garbClsOption">
                    <input type="checkbox" id="organicCheck" name="organic" value="organic" class="garbClsCheckbox">
                    <label for="organicCheck">Organic</label>
                  </section>
                  <section class="garbClsOption">
                    <input type="checkbox" id="paperCheck" name="paper" value="paper" class="garbClsCheckbox">
                    <label for="paperCheck">Paper</label>
                  </section>
                </div>
              </div>
              <div class="garbClsContainer">
                <div class="garbClsHeader">Capacity</div>
                <div class="garbClsTypes">
                  <section class="garbClsOption">
                    <input type="checkbox" id="full" name="full" value="full" class="garbClsCheckbox">
                    <label for="full">Full</label>
                  </section>
                  <section class="garbClsOption">
                    <input type="checkbox" id="halfFull" name="halfFull" value="halfFull" class="garbClsCheckbox">
                    <label for="halfFull">Half-full</label>
                  </section>
                  <section class="garbClsOption">
                    <input type="checkbox" id="empty" name="empty" value="empty" class="garbClsCheckbox">
                    <label for="empty">Empty</label>
                  </section>
                </div>
              </div>
              <div class="garbClsContainer">
                <div class="serialNHeader">Search by serial number</div>
                <div class="searchInputContainer">
                  <input type="number" id="searchNumber" name="searchNumber" placeholder="0" min="0" class="containerInput">
                </div>
              </div>
            </div>
          </aside>
          <div class="containersList">
            <div class="btnContainer">
              <button id="toggleSimulation" class="ma-2 pa-2 mx-auto success small">Initiate simulation</button>
            </div>
            <div class="containersBoxMap">
              <div id="map"></div>
              <div id="popup" class="ol-popup">
                <a href="#" id="popup-closer" class="ol-popup-closer"></a>
                <div id="popup-content"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
        <script>
          document.addEventListener("DOMContentLoaded", () => {
            const mapElement = document.getElementById("map");
            const toggleButton = document.getElementById("toggleSimulation");
            const popupContent = document.getElementById("popup-content");
            const popupCloser = document.getElementById("popup-closer");
            const popup = document.getElementById("popup");

            let simulationRunning = false;

            toggleButton.addEventListener("click", () => {
              simulationRunning = !simulationRunning;
              toggleButton.textContent = simulationRunning ? "Stop simulation" : "Initiate simulation";
              toggleButton.classList.toggle("error", simulationRunning);
              toggleButton.classList.toggle("success", !simulationRunning);
            });

            // Initialize OpenLayers map
            const map = new ol.Map({
              target: mapElement,
              layers: [
                new ol.layer.Tile({
                  source: new ol.source.OSM(),
                }),
              ],
              view: new ol.View({
                center: ol.proj.fromLonLat([-2.388, 36.84]),
                zoom: 13,
              }),
            });

            // Setup popup
            const overlay = new ol.Overlay({
              element: popup,
              positioning: "bottom-center",
              stopEvent: false,
            });
            map.addOverlay(overlay);

            popupCloser.addEventListener("click", () => {
              overlay.setPosition(undefined);
              return false;
            });

            map.on("singleclick", (event) => {
              const coordinate = event.coordinate;
              popupContent.innerHTML = "<p>Clicked at " + ol.proj.toLonLat(coordinate).join(", ") + "</p>";
              overlay.setPosition(coordinate);
            });
          });
    </script>
  `;
};