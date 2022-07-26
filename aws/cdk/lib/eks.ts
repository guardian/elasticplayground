import {Construct} from "constructs";
import {GuStack} from "@guardian/cdk/lib/constructs/core";
import {InstanceClass, InstanceSize, InstanceType, ISubnet, IVpc} from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import {CapacityType, DefaultCapacityType, EndpointAccess, NodegroupAmiType} from "aws-cdk-lib/aws-eks";
import * as kms from "aws-cdk-lib/aws-kms";
import {AccountPrincipal, FederatedPrincipal, ManagedPolicy, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {Stack, Fn} from "aws-cdk-lib";

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

//FIXME: needs to be filled in
const controlPlaneRolePolicies = [
    "AmazonEKSClusterPolicy"
];

export class ElasticPlaygroundCluster extends Construct {

    constructor(scope: GuStack, id: string, props:ElasticPlaygroundClusterProps) {
        super(scope, id);

        const secretsKey = new kms.Key(this, "KubeSecretsKey", {

        });

        const clusterRole = new Role(this, "KubeControlRole", {
            assumedBy: new ServicePrincipal('eks.amazonaws.com'),
            managedPolicies: controlPlaneRolePolicies.map(n=>ManagedPolicy.fromAwsManagedPolicyName(n)),
            description: "Role for EKS cluster control-plane nodes"
        });

        const workerRole = new Role(this, "KubeWorkerRole", {
            assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
            managedPolicies: workerRolePolicies.map(n=>ManagedPolicy.fromAwsManagedPolicyName(n)),
            description: "Role for EKS cluster worker nodes"
        });


        const cluster = new eks.Cluster(this, "Cluster", {
            role: clusterRole,
            secretsEncryptionKey: secretsKey,
            vpcSubnets: [
                {
                    subnets: props.subnets,
                }
            ],
            version: eks.KubernetesVersion.V1_21,
            vpc: props.vpc,
            defaultCapacity: 0,
            outputMastersRoleArn: true
        });
        const janusRole = Role.fromRoleArn(this, "janusRole", "");

        cluster.awsAuth.addMastersRole(janusRole);

        //FIXME: remember to add a service account linked to role that allows S3 snapshot bucket access
        //this should come in a seperate submodule.


        Stack.of(this).availabilityZones.forEach(zoneId=>
            cluster.addNodegroupCapacity(`NodeGroup${zoneId}`, {
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
        )
    }
}