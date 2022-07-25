import { join } from 'path';
import type { GuStackProps } from '@guardian/cdk/lib/constructs/core';
import { GuStack } from '@guardian/cdk/lib/constructs/core';
import type { App } from 'aws-cdk-lib';
import { CfnInclude } from 'aws-cdk-lib/cloudformation-include';
import {GuEc2App} from "@guardian/cdk";
import {GuVpc} from "@guardian/cdk/lib/constructs/ec2";

export class Elasticplayground extends GuStack {
	constructor(scope: App, id: string, props: GuStackProps) {
		super(scope, id, props);

		const vpc = GuVpc.fromIdParameter(this, "primary-vpc", {

		})
	}
}
