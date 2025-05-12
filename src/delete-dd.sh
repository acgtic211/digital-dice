kubectl delete -f dd.yaml

TD_PATH="./td.json"
# Verificar si el archivo td.json existe
if [ ! -f "$TD_PATH" ]; then
  echo "Error: No se encontró el archivo td.json"
  exit 1
else
  kubectl delete configmap td-config
fi

EVENTS_COUNT=$(grep -o '"events":' "$TD_PATH" | wc -l)

# Si hay eventos, lanzamos el EventHandler (dd-eh), si no, no se lanza.
if [ "$EVENTS_COUNT" -gt 0 ]; then
  kubectl delete -f dd-eh.yaml
fi

TYPE=$(grep -o '"@type":.*' "$TD_PATH" | sed 's/.*"@type"://g' | sed 's/[",]//g' | tr -d '[:space:]')
if [ -n "$TYPE" ]; then
  if [ "$TYPE" = "virtual" ] || echo "$TYPE" | grep -q "virtual"; then
    echo "La Thing Description es de tipo 'virtual'. Lanzando la acción correspondiente."
    kubectl delete -f dd-virtualizer.yaml
    kubectl delete configmap behavior-config
    kubectl delete configmap instances-config
  fi
fi

kubectl delete secret tls-dd

kubectl delete -f dd-ui.yaml 