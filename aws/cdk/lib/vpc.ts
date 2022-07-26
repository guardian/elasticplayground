import { aws_ssm } from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import type { Construct } from 'constructs';

/**
 * Why are we using the SyndicationPlatform VPC? Because that's the only one currently offering private subnets.
 * @param scope
 * @constructor
 */
export const LookupVPC = (scope: Construct) => {
	const vpcId = aws_ssm.StringParameter.valueFromLookup(
		scope,
		'/account/vpc/primary/id',
	);
	console.log(`Got VPC ID ${vpcId}`);
	return Vpc.fromLookup(scope, 'DefaultVPC', {
		vpcId: vpcId,
	});
};
