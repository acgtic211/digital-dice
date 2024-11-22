# Buildeamos las imagenes de los contenedores
echo "##### BUILDEANDO CONTROLLER #####"
cd controller
docker build -t digital-dice-controller .

kubectl create secret generic tls-digitaldice \
  --from-file=privkey.pem=privkey.pem \
  --from-file=fullchain.pem=fullchain.pem \
  --from-file=server.crt=server.crt \
  --from-file=server.key=server.key
  
echo "##### BUILDEANDO DATAHANDLER #####"
cd ../datahandler
docker build -t digital-dice-dh .
echo "##### BUILDEANDO EVENTHANDLER #####"
cd ../eventhandler
docker build -t digital-dice-eh .
echo "##### BUILDEANDO REFLECTION #####"
cd ../reflection
docker build -t digital-dice-reflection .

# Aplicamos el YAML para iniciar los contenedores
echo "##### INICIANDO YAML #####"

cd ..

kubectl apply -f digitaldice.yaml 