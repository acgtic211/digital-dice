// mongo-init.js

// Iniciar replicaset
rs.initiate({
    _id: "rs0",
    members: [
      { _id: 0, host: "mongo-0.mongo-headless:27017" },
      { _id: 1, host: "mongo-1.mongo-headless:27017" },
      { _id: 2, host: "mongo-2.mongo-headless:27017" }
    ]
  });
  
  // Esperar a que el replicaset esté listo
  while (rs.status().myState !== 1) {
    print("Esperando a que el nodo primario esté disponible...");
    sleep(1000);
  }
  
  // Crear primer usuario en la primera base de datos
  db = db.getSiblingDB("virtual-interactions");
  db.createUser({
    user: "",
    pwd: "123456virtual",
    roles: [ "readWrite", "dbAdmin" ]
  });
  print("Usuario 'virtual-user' creado en 'virtual-interactions'.");
  
  // Crear segundo usuario en la segunda base de datos
  db = db.getSiblingDB("dd-db");
  db.createUser({
    user: "dd_admin",
    pwd: "123456admin",
    roles: [ "readWrite", "dbAdmin" ]
  });
  print("Usuario 'dd_admin' creado en 'dd-db'.");
  