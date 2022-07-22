# Elasticplayground

## What is it?

This is a setup of a complex Elasticsearch cluster, to facilitate experimentation and learning.  There are seperate
master, data and ingress nodes and Cerebro is deployed for cluster monitoring.

To simplify deployment and configuration, the whole thing is expressed as Kubernetes manifests and is easily deployable on Minikube

## Prerequisite - running Kubernetes.

No, don't run away!  This is actually (fairly) easy.

- Download and install `kubectl` - https://kubernetes.io/docs/tasks/tools/#kubectl
- Download and install `minikube` - https://minikube.sigs.k8s.io/docs/start/
- Run `minikube start --cpus=8 --memory=16G --driver={somedriver}`.  See below for what to use in place of `{somedriver}`.
- This takes a couple of minutes; it will create a VM in the hypervisor you specify and bootstrap a kubernetes cluster into it.
- Wait for it to complete; Hey presto, you have a working Kubernetes.

While Kubernetes is now working, we want to have a couple of addons present:
- `minikube addons enable ingress`
- `minikube addons enable metrics-server` (optional)
- `minikube addons enable dashboard` (optional)

### What's all this about a driver?

Minikube needs to know which hypervisor to use.  This will depend on the OS and hardware platform you're running on.

- **Linux/intel** - I'd recommend `kvm2`
- **Linux/arm** - I've not tried this at all, but I guess that `kvm` should work fine.
- **Mac/intel** - I've used `virtualbox` in the past (this obviously requires Virtualbox to be installed).
`hyperkit` is also an option, but I couldn't use this before because the company security on my previous Mac
would not allow me to run binaries outside the system path as non-root.  Your mileage may vary.
- **Mac/arm64** - You'll need to use `qemu2`. For this, you'll need to download and install `qemu` before running `minikube`.
Unfortunately this is not particularly well-supported yet (see later).

## Let's get deploying!

OK, so I am sure you are now raring to go.

1. `cd kube/`
2. `kubectl apply -f 1_masternodes`
3. `watch -n1 kubectl get pods`

Assuming you have the excellent `watch` utility installed (standard on Linux and macos 12) then you'll see some pods called
`elasticsearch-master` starting up.  You should expect two to appear, about 30-45 seconds apart.  This is because the system
ensures that the first is operational before bringing up the second.
Note that the first will sit `ContainerCreating` for some time - this is because the system is busy downloading the elasticsearch image
from Docker Hub.  Once the image has been downloaded, it is cached locally and won't be downloaded again.

While keeping that `watch` command open in one Terminal, I would recommend opening another terminal and running:
4. `kubectl logs -f elasticsearch-master-0`
This has the effect of tailing the logs, with `-f` meaning `follow` just the same as on the `tail` command
