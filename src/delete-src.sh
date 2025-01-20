kubectl delete -f src.yaml

TD_PATH="./td.json"
# Verificar si el archivo td.json existe
if [ ! -f "$TD_PATH" ]; then
  echo "Error: No se encontró el archivo td.json"
  exit 1
else
  kubectl delete configmap td-config
fi

# Contar la cantidad de eventos en la TD utilizando grep
EVENTS_COUNT=$(grep -o '"events":' "$TD_PATH" | wc -l)

# Si hay eventos, lanzamos el EventHandler (src-eh), si no, no se lanza.
if [ "$EVENTS_COUNT" -gt 0 ]; then
  kubectl delete -f src-eh.yaml
fi

kubectl delete secret tls-src