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

**VERY IMPORTANT** Run this now, before you forget:
```
minikube ssh "sudo sysctl -w vm.max_map_count=262144"
```
This is a kernel parameter which is required for Elasticsearch to boot. If you don't do it, then none of the ES pods will
start - they will fail with a 'bootstrap checks' error message.

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

## Configure hosting

**NOTE** This does NOT currently work on Apple Silicon.  That's because the qemu2 driver is experimental and does not support
proper host networking yet.  See the end of the section for some workarounds.

Once we have stuff deployed, you'll want to actually access it from your web browser.  There are multiple ways of doing this,
but this is the most elegant.

1. As long as you have a compatible hypervisor driver (e.g. kvm2 and virtualbox) then the minikube VM is attached to a
"host-only" network interface and has an IP address that is accessible on the host machine.  Run `minikube ip` to get
this IP address
2. Edit `/etc/hosts` (root required!) and add the following line:
```
x.y.z.q         elasticplayground.local
```
where `x.y.z.q` is the IP address that `minikube ip` gave you.
3. Assuming that you ran `minikube addons enable ingress` in the "prerequisite" step, you should be able to go ahead
and point your browser to http://elasticplayground.local.  You should see a generic nginx "404 Not Found" page (we don't have
any sites configured yet).  https://elasticplayground.local should _also_ work, but give you an "invalid certificate" warning

### That's all very well, but I am on an M1 mac and want to try it

Go on then :-p

When I tried this, I found that the qemu VM that minikube configures on the m1 does NOT have the host-only adaptor - 
or at least you can't route to it from the local machine.  This is a bit of a pig to say the least.

Minikube communicates with the VM by forwarding port 22, and this means that there is a workaround.

When you have some manifests deployed, you can forward a port onto one of the pods by running:

```
kubectl port-forward {pod-name} {pod-port}:{host-port}
```

for example:

```
kubectl port-forward elasticsearch-master-0 9200:9200
```

or:

```
kubectl port-forward kibana-xxxxxx-xxxx 5601:5601
```

Consult the "service" definitions in the `kube/` subdirectory for details of which ports are required for which component.

## Let's get deploying!

OK, so I am sure you are now raring to go.

### ES cluster bootstrap

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

5. Once both pods have started and are showing as Ready, you should be able to connect to the REST API in your browser
at http://elasticplayground.local/api.  Note that _at least two pods_ must be running for the cluster to be quorate and
therefore start.

### Cerebro monitoring

1. Keep your `watch -n1 kubectl get pods` 
2. Open the file `2_cerebro/cerebro.yaml`
3. Uncomment the relevant `image:` line depending on whether you are on arm or x86
4. `kubectl apply -f 2_cerebro`
5. Point your browser to https://elasticplayground.local/cerebro/ (**NOTE** THE TRAILING SLASH! It's important!)

You should see the cluster in RED status with "3 unassigned shards".  This is unsurprising as we have not yet brought up
any data nodes.  If you go to the "nodes" tab, then you will see our two master nodes.

### Data nodes