kubectl delete -f digital-dice.yaml

TD_PATH="./td.json"
# Verificar si el archivo td.json existe
if [ ! -f "$TD_PATH" ]; then
  echo "Error: No se encontró el archivo td.json"
  exit 1
else
  kubectl delete configmap td-config
fi

EVENTS_COUNT=$(grep -o '"events":' "$TD_PATH" | wc -l)

# Si hay eventos, lanzamos el EventHandler (digital-dice-eh), si no, no se lanza.
if [ "$EVENTS_COUNT" -gt 0 ]; then
  kubectl delete -f digital-dice-eh.yaml
fi

TYPE=$(grep -o '"@type":.*' "$TD_PATH" | sed 's/.*"@type"://g' | sed 's/[",]//g' | tr -d '[:space:]')
if [ -n "$TYPE" ]; then
  if [ "$TYPE" = "virtual" ] || echo "$TYPE" | grep -q "virtual"; then
    echo "La Thing Description es de tipo 'virtual'. Lanzando la acción correspondiente."
    kubectl delete -f digital-dice-virtualizer.yaml
    kubectl delete configmap behavior-config
  fi
fi

kubectl delete secret tls-digital-dice

kubectl delete -f digital-dice-ui.yaml 