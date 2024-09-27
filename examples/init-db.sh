#!/bin/bash

# Aplicar el archivo YAML para desplegar MongoDB en Kubernetes
echo "Aplicando el archivo YAML..."
kubectl apply -f mongo-v7.yaml

# Dar tiempo para que los pods se inicien
echo "Esperando a que los pods de MongoDB se inicien..."
sleep 60  # Ajusta el tiempo según sea necesario

# Iniciar el replicaset en el pod mongo-0
echo "Iniciando el replicaset en MongoDB..."
kubectl exec mongo-0 -- mongosh --eval '
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo-0.mongo-headless:27017" },
    { _id: 1, host: "mongo-1.mongo-headless:27017" },
    { _id: 2, host: "mongo-2.mongo-headless:27017" }
  ]
});
'

# Esperar un momento para que se configure el replicaset
echo "Esperando a que el replicaset se configure..."
sleep 10

# Comprobar el estado del replicaset
echo "Comprobando el estado del replicaset..."
kubectl exec mongo-0 -- mongosh --eval "rs.status()"

# Crear las bases de datos y los usuarios
echo "Creando la base de datos virtual-interactions y el usuario..."
kubectl exec mongo-0 -- mongosh --eval '
use virtual-interactions
db.createUser({
  user: "virtual-user",
  pwd: "123456virtual",
  roles: [ "readWrite", "dbAdmin" ]
});
'

echo "Creando la base de datos dd-db y el usuario..."
kubectl exec mongo-0 -- mongosh --eval '
use dd-db
db.createUser({
  user: "dd_admin",
  pwd: "123456admin",
  roles: [ "readWrite", "dbAdmin" ]
});
'

echo "Proceso completado."
