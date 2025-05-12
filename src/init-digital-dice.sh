cd ./certs

kubectl create secret generic tls-digital-dice \
  --from-file=privkey.pem=privkey.pem \
  --from-file=fullchain.pem=fullchain.pem \
  --from-file=server.crt=server.crt \
  --from-file=server.key=server.key

echo "##### INICIANDO YAML #####"

cd ..

TD_PATH="./td.json"
if [ ! -f "$TD_PATH" ]; then
  echo "Error: No se encontró el archivo td.json"
  exit 1
else 
  kubectl create configmap td-config --from-file=td.json
fi



EVENTS_COUNT=$(grep -o '"events":' "$TD_PATH" | wc -l)

if [ "$EVENTS_COUNT" -gt 0 ]; then
  kubectl apply -f digital-dice-eh.yaml
else
  echo "La Thing Description no tiene eventos. No se lanzará el EventHandler."
fi

TYPE=$(grep -o '"@type":.*' "$TD_PATH" | sed 's/.*"@type"://g' | sed 's/[",]//g' | tr -d '[:space:]')
if [ -n "$TYPE" ]; then
  if [ "$TYPE" = "virtual" ] || echo "$TYPE" | grep -q "virtual"; then
    echo "La Thing Description es de tipo 'virtual'. Lanzando la acción correspondiente."

    BEHAVIOR_PATH="./behavior.json"
    if [ ! -f "$BEHAVIOR_PATH" ]; then
      echo "Error: No se encontró el archivo behavior.json"
      exit 1
    else 
      kubectl create configmap behavior-config --from-file=behavior.json
      cd ./virtualizer
      kubectl create configmap instances-config --from-file=instances.json
      cd ..
    fi

    kubectl apply -f digital-dice-virtualizer.yaml
  fi
fi

kubectl apply -f digital-dice.yaml 

kubectl apply -f digital-dice-ui.yaml 