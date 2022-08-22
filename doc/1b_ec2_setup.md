# Setting it up on EC2

## Prerequisite - have an instance

Obviously, you need to start with an EC2 instance.

1. Go to 'Launch Instance' in the EC2 console and choose something suitably large (I was testing using an r6g.8xlarge,
which provides 32 cores and 256Gb RAM.  That's a bit of overkill but remember we want to be running a LOT of Elasticsearch
instances on here and they are notoriously memory-hungry especially when they have data).
2. Use an Ubuntu image, as there are good setup instructions for Docker on that.
3. Create a new instance role, we'll put some policies on it later.
4. Add a hefty amount of storage. Everything from every instance will be going onto the root EBS volume (in a default 
configuration, anyway).  Say 512Gb or so, depending on how large a dataset you want to import.
5. Create a new Security Group.  We'll need SSH to your current address, and 443 to your current address as well.
SSM won't work unless AWS can access the instance's 443 port but I got around this by using SSH instead. Future versions
of this guide will improve on these recommendations....
6. If you're relying on SSH make sure that you create a keypair and download the public key.  This is not recommended
in production but for a small test it's OK. It's also useful for debugging any issues with SSM connectivity.
7. Launch it
8. Go to the IAM console and locate/edit the Role that you created in step 3.
9. Add the 'AmazonSSMManagedInstanceCore' AWS managed Role
10. (Optional) Create a new policy from the file [aws/minikube-node-policy.json](../aws/minikube-node-policy.json) and add
it onto the role as well.  This is not actually needed to make the base installation work, but if you want to experiment
with getting more AWS features onto the cluster you'll want it.
11. By now the instance should have booted.  SSH or SSM into it, and we are ready to start.....
12. Run `apt-get -y update && apt-get -y upgrade`. You know you should.

## Install minikube

We are going to be installing docker and Kubernetes via Minikube _on the node itself_, not in a VM.  Therefore we 
are going to need to do it as root.
I've provided a script to help you do this.  So the next thing to do, on your new EC2 node of course, is:
```bash
git clone https://github.com/guardian/elasticplayground
```

Take a quick browse of the script at [aws/startup-script.sh](../aws/startup-script.sh) and note the architecture
detection and Kubernetes version at the top. Note that I had installation issues with kubernetes 1.24+ and that's
why the version is hard-set in its current way.

Once you are happy, then switch to root and run the script:

```bash
cd elasticplayground
chmod a+x aws/startup-script.sh
sudo aws/startup-script.sh
```

Some stages (like enabling the ingress addon) can take much longer than others (several minutes).  I have had it hang,
on occasion; if this happens then it's probably easiest to copy-paste the relevant commands out of the script into your
terminal.  Most of the setup for Kubernetes is indempotent so it's safe to run commands multiple times; if the system
is already in the requested state then nothing will be changed.
If you want to re-run the script without deleting the minikube installation, then simply comment out the `minikube start`
line and run it again.

Once the startup script finishes, then log out and log back in again.  This is to pick up the permission changes on
the `ubuntu` user to allow it to use `kubectl`.  Test it out by running `kubectl get nodes` after you log back in;
you should see one node, whose name is the same as the instance's hostname.

## Prepare for deployment

The last thing you should do is to visit the setup for the ES master and data nodes (../kube/1_masternodes/esdata.yaml, 
../kube/3_datanodes/esdata.yaml) and locate the `limits` section.  This is deliberately set very low, to allow it to
run ok on a laptop.  But now you have cores and RAM to spare, so crank them up a bit! This will make deployment easier,
because when the core count is low Elasticsearch can take a long time to start up, resulting in the pods failing liveness
check and being restarted.  Make your life easier, and push them up to 4 cores or so and a good chunk of RAM now.

Note that you don't need to explicitly set the JVM heap allowance.  Apparently the JVM is cgroups aware on the Linux 
kernel and therefore takes the `limit` value you specify as the `system` RAM when sizing the heap. (e.g. if you set a 
`limit` of `4G` then the JVM will set the heap limit to 2 gigabytes, defaulting to 50% of "system" RAM).

Now you can move on to [Deployment](2_deployment.md)

