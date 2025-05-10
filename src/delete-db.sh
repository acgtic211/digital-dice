kubectl delete -f mongo-v7.yaml

kubectl delete secret mongodb-secret

kubectl delete pvc mongo-persistent-storage-mongo-0

kubectl delete pvc mongo-persistent-storage-mongo-1

kubectl delete pvc mongo-persistent-storage-mongo-2