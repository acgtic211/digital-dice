kubectl create configmap td-config --from-file=originalTd.json

cd ./certs

kubectl create secret generic tls-src \
  --from-file=privkey.pem=privkey.pem \
  --from-file=fullchain.pem=fullchain.pem \
  --from-file=server.crt=server.crt \
  --from-file=server.key=server.key

echo "##### INICIANDO YAML #####"

cd ..

kubectl apply -f src.yaml 