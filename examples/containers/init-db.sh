#!/bin/bash

# Aplicar el archivo YAML para desplegar MongoDB en Kubernetes
echo "Aplicando el archivo YAML..."
kubectl apply -f mongo-v7.yaml

# Dar tiempo para que los pods se inicien
echo "Esperando a que los pods de MongoDB se inicien..."
sleep 60  # Aumenta el tiempo de espera según sea necesario

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

# Verificar si el replicaset se ha iniciado correctamente
echo "Esperando a que el replicaset se configure..."
sleep 30  # Aumentar el tiempo de espera para asegurar que el replicaset se forma

# Verificar si el nodo está en estado PRIMARY antes de continuar
REPLICA_STATUS=$(kubectl exec mongo-0 -- mongosh --quiet --eval 'rs.status().members.find(m => m.self).stateStr')

while [[ "$REPLICA_STATUS" != "PRIMARY" ]]; do
    echo "El nodo aún no es PRIMARY, esperando..."
    sh delete-db.sh
    sleep 10
    sh init-db.sh
    REPLICA_STATUS=$(kubectl exec mongo-0 -- mongosh --quiet --eval 'rs.status().members.find(m => m.self).stateStr')
done

echo "El nodo es PRIMARY. Creando la base de datos y los usuarios..."

# Crear las bases de datos y los usuarios
echo "Creando la base de datos 'virtual-interactions' y el usuario..."
kubectl exec mongo-0 -- mongosh --eval '
db = db.getSiblingDB("virtual-interactions");
db.createUser({
  user: "dd-user",
  pwd: "dd-password",
  roles: [ "readWrite", "dbAdmin" ]
});
db.virtualCollection.insertOne({ name: "delete_me" });
' 

# Crear la base de datos 'dd-db' y el usuario
echo "Creando la base de datos 'db_name' y el usuario..."
kubectl exec mongo-0 -- mongosh --eval '
db = db.getSiblingDB("db_name");
db.createUser({
  user: "db_user",
  pwd: "db_password",
  roles: [ "readWrite", "dbAdmin" ]
});
db.ddCollection.insertOne({ name: "delete_me" });
' 

echo "Proceso completado."
