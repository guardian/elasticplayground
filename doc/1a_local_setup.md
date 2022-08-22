# Setting it up on your local machine

## Prerequisite - running Kubernetes.

No, don't run away!  This is actually (fairly) easy.

- Download and install `kubectl` - https://kubernetes.io/docs/tasks/tools/#kubectl
- Download and install `minikube` - https://minikube.sigs.k8s.io/docs/start/
- Run `minikube start --cpus=8 --memory=16G --driver={somedriver} [--disk-size=100G]`.  See below for what to use in place of `{somedriver}`.
  The extra disk space is necessary on Apple Silicon; on Intel you can share folders onto the VM so you don't need it.
- This takes a couple of minutes; it will create a VM in the hypervisor you specify and bootstrap a kubernetes cluster into it.
- Wait for it to complete; Hey presto, you have a working Kubernetes.

**VERY IMPORTANT** Run this now, before you forget:
```
minikube ssh "sudo sysctl -w vm.max_map_count=262144"
```
This is a kernel parameter which is required for Elasticsearch to boot. If you don't do it, then none of the ES pods will
start - they will fail with a 'bootstrap checks' error message.
I've sometimes found that the setting doesn't "stick" - if your pods keep crash-looping when you bring up the stack again
then try re-running this command.

While Kubernetes is now working, we want to have a couple of addons present:
- `minikube addons enable ingress` (this can take ages to run, but is important)
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

### Gimme back my RAM!

If you want to stop the VM without deleting it, you can simply run `minikube stop`.  This will terminate the VM and free
up all associated resources on your host.  To start experimenting again, run `minikube start`.
Note that `minikube start` will try to bring _everything_ back up together. This can cause timeouts on the liveness probes,
resulting in crashloops.  One option is simply to wait until the system has sorted itself out; another is to wait a short
time until the gaps between restarts are at least 10 seconds then manually restart a single pod by deleting it.  It will
then come back up without contention and should pass the liveness check.

## Configure hosting

**NOTE** This does NOT currently work well on Apple Silicon.  That's because the qemu2 driver is experimental and does not support
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

Once the ingress controller is deployed (`minikube addons enable ingress`), you can set up a port-forward onto it to
allow http or https access:
1. Change `kube/1_masternodes/ingress.yaml` line 9 to read `- host: localhost` instead of `- host: elasticplayground.local`
2. If you already deployed it, then redeploy it: `kubectl apply -f 1_masternodes/ingress.yaml`
3. Find the name of the ingress controller's pod: `kubectl get pods -n ingress-nginx`
```
NAME                                        READY   STATUS      RESTARTS   AGE
ingress-nginx-admission-create-98k4n        0/1     Completed   0          13h
ingress-nginx-admission-patch-tw7bh         0/1     Completed   1          13h
ingress-nginx-controller-59b45fb494-hhns8   1/1     Running     1          13h
```
In this case, the pod name is `ingress-nginx-controller-59b45fb494-hhns8` because that's the one that's Running (the others
are setup jobs which have completed successfully).
4. In a spare Terminal window (you'll need to keep the command running all the time you want access), forward either port
   80 or 443 onto your localhost:
```bash
kubectl -n ingress-nginx port-forward {podname} 8000:80
```
5. With this running, you should now be able to use `http://localhost:8000` in place of `http(s)://elasticplayground.local`
   in the rest of this guide.

## What do I do next?

Proceed to [Deploying the containers](2_deployment.md)