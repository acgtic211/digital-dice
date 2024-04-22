docker build -t dd-garbage-containers-controller -f ./containers/controller/dockerfile .
docker build -t dd-garbage-containers-dh -f ./containers/datahandler/dockerfile .
docker build -t dd-garbage-containers-eventhandler -f ./containers/eventhandler/dockerfile .
docker build -t dd-garbage-containers-reflection -f ./containers/reflection/dockerfile .
docker build -t dd-garbage-containers-virtualizer -f ./containers/virtualizer/dockerfile .