# Buildeamos las imagenes de los contenedores
echo "##### BUILDEANDO CONTROLLER #####"
cd controller
docker build -t src-controller .

kubectl create secret generic tls-src \
  --from-file=privkey.pem=privkey.pem \
  --from-file=fullchain.pem=fullchain.pem \
  --from-file=server.crt=server.crt \
  --from-file=server.key=server.key

cd ../

kubectl create configmap td-config --from-file=originalTd.json
  
echo "##### BUILDEANDO DATAHANDLER #####"
cd ./datahandler
docker build -t src-dh .
echo "##### BUILDEANDO EVENTHANDLER #####"
cd ../eventhandler
docker build -t src-eh .
echo "##### BUILDEANDO REFLECTION #####"
cd ../reflection
docker build -t src-reflection .

# Aplicamos el YAML para iniciar los contenedores
echo "##### INICIANDO YAML #####"

cd ..

kubectl apply -f src.yaml 