# Buildeamos las imagenes de los contenedores
echo "##### BUILDEANDO CONTROLLER #####"
cd controller
docker build -t original-things-controller .

kubectl create secret generic tls-original-things \
  --from-file=privkey.pem=privkey.pem \
  --from-file=fullchain.pem=fullchain.pem \
  --from-file=server.crt=server.crt \
  --from-file=server.key=server.key
  
echo "##### BUILDEANDO DATAHANDLER #####"
cd ../datahandler
docker build -t original-things-dh .
echo "##### BUILDEANDO EVENTHANDLER #####"
cd ../eventhandler
docker build -t original-things-eh .
echo "##### BUILDEANDO REFLECTION #####"
cd ../reflection
docker build -t original-things-reflection .

# Aplicamos el YAML para iniciar los contenedores
echo "##### INICIANDO YAML #####"

cd ..

kubectl apply -f tdo.yaml 