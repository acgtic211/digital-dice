#!/bin/bash

# Aplicar el archivo YAML para desplegar MongoDB en Kubernetes
echo "Aplicando el archivo YAML..."
kubectl apply -f mongo-v7.yaml

# Dar tiempo para que los pods se inicien
echo "Esperando a que los pods de MongoDB se inicien..."
sleep 30  # Ajusta el tiempo según sea necesario

# Iniciar el replicaset en el pod mongo-0
echo "Iniciando el replicaset y configurando MongoDB..."
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

# Esperar un tiempo para que el replicaset se configure
echo "Esperando a que el replicaset se configure..."
sleep 20  # Asegúrate de darle tiempo suficiente al replicaset para formarse

# Verificar si el nodo está en estado PRIMARY antes de continuar
REPLICA_STATUS=$(kubectl exec mongo-0 -- mongosh --quiet --eval 'rs.status().members.find(m => m.self).stateStr')

while [[ "$REPLICA_STATUS" != "PRIMARY" ]]; do
    echo "El nodo aún no es PRIMARY, esperando..."
    sleep 5
    REPLICA_STATUS=$(kubectl exec mongo-0 -- mongosh --quiet --eval 'rs.status().members.find(m => m.self).stateStr')
done

echo "El nodo es PRIMARY. Creando la base de datos y los usuarios..."

# Crear las bases de datos y los usuarios
echo "Creando la base de datos 'virtual-interactions' y el usuario..."
kubectl exec mongo-0 -- mongosh --eval '
db = db.getSiblingDB("virtual-interactions");
db.createUser({
  user: "virtual-user",
  pwd: "123456virtual",
  roles: [ "readWrite", "dbAdmin" ]
});
'

echo "Creando la base de datos 'dd-db' y el usuario..."
kubectl exec mongo-0 -- mongosh --eval '
db = db.getSiblingDB("dd-db");
db.createUser({
  user: "dd-user",
  pwd: "ddpassword",
  roles: [ "readWrite", "dbAdmin" ]
});
'

echo "Proceso completado."
