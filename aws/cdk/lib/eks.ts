import {Construct} from "constructs";
import {GuStack} from "@guardian/cdk/lib/constructs/core";
import {InstanceClass, InstanceSize, InstanceType, ISubnet, IVpc} from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import {CapacityType, NodegroupAmiType} from "aws-cdk-lib/aws-eks";
import {ManagedPolicy, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {Stack, Fn} from "aws-cdk-lib";
import {EKS_CLUSTER_NAME} from "./constants";

interface ElasticPlaygroundClusterProps {
    vpc: IVpc;
    subnets: ISubnet[];
    maxNodesPerAZ?: number;
}

const workerRolePolicies = [
    "AmazonEKSWorkerNodePolicy",
    "AmazonEC2ContainerRegistryReadOnly",
    "AmazonSSMManagedInstanceCore",
    "AmazonEKS_CNI_Policy",
];


export class ElasticPlaygroundCluster extends Construct {

    constructor(scope: GuStack, id: string, props:ElasticPlaygroundClusterProps) {
        super(scope, id);

        const workerRole = new Role(this, "KubeWorkerRole", {
            assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
            managedPolicies: workerRolePolicies.map(n=>ManagedPolicy.fromAwsManagedPolicyName(n)),
            description: "Role for EKS cluster worker nodes"
        });

        const cluster = eks.Cluster.fromClusterAttributes(this, "Cluster", {
            clusterName: EKS_CLUSTER_NAME,
            vpc: props.vpc,
        });

        //FIXME: remember to add a service account linked to role that allows S3 snapshot bucket access
        //this should come in a seperate submodule.

        Stack.of(this).availabilityZones.forEach(zoneId=> {
            const ng = new eks.Nodegroup(this, `NodeGroup${zoneId}`, {
                cluster: cluster,
                subnets: {
                    onePerAz: true,
                    availabilityZones: [zoneId],
                    subnets: props.subnets,
                },
                amiType: NodegroupAmiType.AL2_ARM_64,
                minSize: 0,
                maxSize: props.maxNodesPerAZ ?? 1,
                desiredSize: props.maxNodesPerAZ ? props.maxNodesPerAZ >=1 ? props.maxNodesPerAZ/2 : 1 : 1,
                instanceTypes: [
                    InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE),
                ],
                nodeRole: workerRole,
                capacityType: CapacityType.ON_DEMAND,
            })
        })
    }
}