#!/bin/bash -e

#### DO NOT RUN THIS SCRIPT ON YOUR LOCAL MACHINE
KUBERNETES_VERSION='1.22.12'  ###NOTE that this is not compatible with 1.24+ as you must install a seperate CRI driver in later versions
AWS_ZONE=$(curl "http://169.254.169.254/latest/meta-data/placement/availability-zone")
AWS_REGION=$(curl "http://169.254.169.254/latest/meta-data/placement/region")
ARCH=$(dpkg --print-architecture)

### This script will configure the basic docker & minikube setup on a vanilla Ubuntu EC2 image

if [ "$EUID" != "0" ]; then
  echo This script is intended to be used to bootstrap a vanilla EC2 instance. Do NOT run it on your local machine!
  echo Sorry, this needs to be run as root.
  exit 1
fi

### Standard Docker installation instructions taken from https://docs.docker.com/engine/install/ubuntu/
echo ----------------------------------
echo Installing Docker
echo ----------------------------------

mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o - > /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get -y install docker-ce docker-ce-cli containerd.io docker-compose-plugin conntrack

echo ----------------------------------
echo Docker is now installed
echo ----------------------------------


### Standard Minikube installation instructions taken from https://minikube.sigs.k8s.io/docs/start/
echo ----------------------------------
echo Installing Minikube and kubectl
echo ----------------------------------
mkdir -p /tmp/hostpath-provisioner
ln -s /tmp/hostpath-provisioner /persistent-data

echo Architecture is $ARCH. If this is not supported by Minikube, you\'ll get a download error right about now.
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-$ARCH
install minikube-linux-$ARCH /usr/local/bin/minikube
rm -f minikube-linux-$ARCH

curl -LO "https://dl.k8s.io/release/v$KUBERNETES_VERSION/bin/linux/$ARCH/kubectl"
install kubectl /usr/local/bin/kubectl
rm -f kubectl

echo ----------------------------------
echo Minikube is now installed
echo ----------------------------------

### Start up the cluster
echo ----------------------------------
echo Bootstrapping Kubernetes
echo ----------------------------------
sysctl -w fs.protected_regular=0
minikube start --driver=none --kubernetes-version=$KUBERNETES_VERSION

#Quick sanity check - this should output a bunch of pods into the log
kubectl get pods --all-namespaces

echo ----------------------------------
echo Kubernetes is now active
echo ----------------------------------

### Install required addons
echo ----------------------------------
echo Configuring Kubernetes cluster
echo ----------------------------------
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons enable dashboard

### Set up AWS connection
#AWS connection is not proven yet, unfortunately. This means we can't use the EBS storage provisioner, for example.
#The problem is, that when starting from minikube the cluster does not have the expected external configuration for AWS
#which then needs to be added manually. Might be easier just to use EKS instead (though this brings its own complications!)
#echo ----------------------------------
#echo Integrating to AWS
#echo ----------------------------------
#sudo patch -p0 -d / < aws-compat.patch
#echo Waiting for kubelet to come back up....
#systemctl restart kubelet
#sleep 20
#kubectl apply -f storageclass-ebs-default.yaml
#kubectl patch storageclass standard -p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class": "false"}}}'
#kubectl patch node -p '{"metadata":{"labels":{"failure-domain.beta.kubernetes.io/zone":"'${AWS_ZONE}'"}}}'
#
#kubectl patch node -p '{"metadata":{"labels":"topology.kubernetes.io/zone":"'${AWS_ZONE}'"}}}'
#kubectl patch node -p '{"metadata":{"labels":"topology.kubernetes.io/region":"'${AWS_REGION}'"}}}'
#
#echo ----------------------------------
#echo Done
#echo ----------------------------------

### Configure the environment
echo ----------------------------------
echo Configuring default user environment
echo ----------------------------------

#'ubuntu' needs to be able to access the minikube profile in /root (read-only, of course!)
usermod -aG root ubuntu
chmod g+x /root #note that this does NOT give read access to /root but allows group members to chdir through it
chmod -R g+r /root/.minikube/profiles/minikube
mkdir -p /home/ubuntu/.kube
cp /root/.kube/config /home/ubuntu/.kube/config
chown -R ubuntu /home/ubuntu/.kube

# required for Elasticsearch
sysctl -w vm.max_map_count=262144

echo ----------------------------------
echo All done! \`kubectl\` should now work for the \`ubuntu\` user. You may have to log out and log in again to see this.
echo ----------------------------------