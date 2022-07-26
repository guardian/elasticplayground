import type {GuStackProps} from '@guardian/cdk/lib/constructs/core';
import {GuStack} from '@guardian/cdk/lib/constructs/core';
import type {App} from 'aws-cdk-lib';
import {GuVpc, SubnetType} from "@guardian/cdk/lib/constructs/ec2";
import {APP_NAME} from "./constants";
import {ElasticPlaygroundCluster} from "./eks";
import {LookupVPC} from "./vpc";

export class Elasticplayground extends GuStack {
	constructor(scope: App, id: string, props: GuStackProps) {
		super(scope, id, props);

		const vpc = LookupVPC(this);

		const subnets = vpc.privateSubnets
		// const subnets = GuVpc.subnetsFromParameter(this, {
		// 	app: APP_NAME,
		// 	type: SubnetType.PRIVATE,
		// });

		const cluster = new ElasticPlaygroundCluster(this, "playground", {
			vpc: vpc,
			subnets: subnets,
		})
	}
}