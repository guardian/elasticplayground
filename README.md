# Elasticplayground

## What is it?

This is a setup of a complex Elasticsearch cluster, to facilitate experimentation and learning.  There are seperate
master, data and ingress nodes and Cerebro is deployed for cluster monitoring.

To simplify deployment and configuration, the whole thing is expressed as Kubernetes manifests and is easily deployable on Minikube

You can deploy this out onto your local machine, or if you need a bit more capacity you can put it onto an EC2 instance.
There are seperate instructions for each:

- [Running locally](doc/1a_local_setup.md)
- [Running on EC2](doc/1b_ec2_setup.md)
