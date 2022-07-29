#!/bin/bash

KUBECTL=$(which kubectl)
if [ ! -x "$KUBECTL" ]; then
  echo This script requires kubectl to be installed. Please consult https://kubernetes.io/docs/tasks/tools to download it for your machine.
  exit 1
fi

HELM=$(which helm)
if [ ! -x "$HELM" ]; then
  # shellcheck disable=SC2016
  echo 'This script requires helm to be installed. Suggest: `brew install helm`'
  exit 1
fi

#verify cluster connectivity first
kubectl version
if [ "$?" != "0" ]; then
  # shellcheck disable=SC2016
  echo 'Could not verify connection to your cluster.  Have you run aws `eks update-kubeconfig` yet?'
  echo Please also remember that you need to have valid commandline credentials at all times.
  exit 2
fi

echo Configuring helm repositories...
$HELM repo add jetstack https://charts.jetstack.io
$HELM repo add nginx-stable https://helm.nginx.com/stable
$HELM repo add eks https://aws.github.io/eks-charts
$HELM repo add awspca https://cert-manager.github.io/aws-privateca-issuer
$HELM repo update

#FIXME: swap out for kubernetes.io/nginx-ingress then we can swap back the ingress manifest
$HELM install nginx-ingress nginx-stable/nginx-ingress
$HELM install aws-load-balancer-controller eks/aws-load-balancer-controller
$HELM install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --version v1.9.1 --set installCRDs=true