import {Construct} from "constructs";
import {App, Stack} from "aws-cdk-lib";
import * as kms from "aws-cdk-lib/aws-kms";
import {ManagedPolicy, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";

const controlPlaneRolePolicies = [
    "AmazonEKSClusterPolicy"
];

/**
 * EksPrerequisites is a convenience class that defines a cluster role and KMS key to make cluster set-up quicker
 */
export class EksPrerequisites extends Stack {
    constructor(scope: App, id: string) {
        super(scope, id);

        const secretsKey = new kms.Key(this, "KubeSecretsKey", {

        });

        const clusterRole = new Role(this, "KubeControlRole", {
            assumedBy: new ServicePrincipal('eks.amazonaws.com'),
            managedPolicies: controlPlaneRolePolicies.map(n=>ManagedPolicy.fromAwsManagedPolicyName(n)),
            description: "Role for EKS cluster control-plane nodes"
        });
    }
}