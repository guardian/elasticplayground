# Let's get deploying!

OK, so by now I am sure you are now raring to go.

### ES cluster bootstrap

1. `cd kube/`
2. `kubectl apply -f 1_masternodes`
3. `watch -n1 kubectl get pods`

Assuming you have the excellent `watch` utility installed (standard on Linux and macos 12) then you'll see some pods called
`elasticsearch-master` starting up.  You should expect two to appear, about 30-45 seconds apart.  This is because the system
ensures that the first is operational before bringing up the second.  The actual number is configured by the `.spec.replicas`
parameter in `1_masternodes/esmaster.yaml`.

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
5. Once it's running, point your browser to https://elasticplayground.local/cerebro/ (**NOTE** THE TRAILING SLASH! It's important!)

You should see the cluster in RED status with "3 unassigned shards".  This is unsurprising as we have not yet brought up
any data nodes.  If you go to the "nodes" tab, then you will see our two master nodes.

### Data nodes

1. Keep your `watch -n1 kubectl get pods`
2. `kubectl apply -f 3_datanodes`

This will start up 5 data nodes, one at a time (see the `.spec.replicas` setting in `3_datanodes/esdata.yaml`) - your `watch`
session should show them all starting up, one at a time.  If you're monitoring Cerebro in your browser you should see the nodes
appearing one by one, and the cluster state gradually changing from "red" to "green" as we receive enough data nodes
to hold the basic data

The fairly long delays are to ensure that each node has a chance to properly start up and pass liveness checks before
starting the next one.

### Ingest nodes (optional)

1. Keep your `watch -n1 kubectl get pods`
2. `kubectl apply -f 4_ingestnodes`

### Kibana

1. Keep your `watch -n1 kubectl get pods`
2. `kubectl apply -f 5_kibana`

You should be getting used to this deployment style now! After it's downloaded and started up, you should be able to
access Kibana at http://elasticplayground.local/kibana/ (**Note** the trailing slash).

## Where's the data?

So we now have a decently-sized Elasticsearch cluster with dedicated masters. But search is useless without data, isn't it?

Of course, you can just create indexes and index some fresh data with the API - use `http://elasticsearch.local/api/` to
contact the API (instead of the more usual `http://localhost:9200`).

But if you want to get a lot of data on there, you'll want to obtain a snapshot of a live system and deploy that.

**NOTE** qemu on Apple Silicon does not yet support sharing folders, and will report an error. See below for a workaround.
