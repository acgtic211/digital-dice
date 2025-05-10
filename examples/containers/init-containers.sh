# Buildeamos las imagenes de los contenedores
echo "##### BUILDEANDO CONTROLLER #####"
cd controller
docker build -t dd-garbage-containers-controller .

kubectl create secret generic tls-containers \
  --from-file=server.crt=server.crt \
  --from-file=server.key=server.key

echo "##### BUILDEANDO DATAHANDLER #####"
cd ../datahandler
docker build -t dd-garbage-containers-dh .
echo "##### BUILDEANDO EVENTHANDLER #####"
cd ../eventhandler
docker build -t dd-garbage-containers-eh .
echo "##### BUILDEANDO REFLECTION #####"
cd ../reflection
docker build -t dd-garbage-containers-reflection .
echo "##### BUILDEANDO VIRTUALIZER #####"
cd ../virtualizer
docker build -t dd-garbage-containers-virtualizer .

# Aplicamos el YAML para iniciar los contenedores
echo "##### INICIANDO YAML #####"
cd ..
kubectl apply -f containers.yaml 