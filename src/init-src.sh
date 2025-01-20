cd ./certs

kubectl create secret generic tls-src \
  --from-file=privkey.pem=privkey.pem \
  --from-file=fullchain.pem=fullchain.pem \
  --from-file=server.crt=server.crt \
  --from-file=server.key=server.key

echo "##### INICIANDO YAML #####"

cd ..

TD_PATH="./td.json"
# Verificar si el archivo td.json existe
if [ ! -f "$TD_PATH" ]; then
  echo "Error: No se encontró el archivo td.json"
  exit 1
else 
  kubectl create configmap td-config --from-file=td.json
fi

# Contar la cantidad de eventos en la TD utilizando grep
EVENTS_COUNT=$(grep -o '"events":' "$TD_PATH" | wc -l)

# Si hay eventos, lanzamos el EventHandler (src-eh), si no, no se lanza.
if [ "$EVENTS_COUNT" -gt 0 ]; then
  kubectl apply -f src-eh.yaml
else
  echo "La Thing Description no tiene eventos. No se lanzará el EventHandler."
fi

kubectl apply -f src.yaml 