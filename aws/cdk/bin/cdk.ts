import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { Elasticplayground } from '../lib/elasticplayground';

const app = new App();
new Elasticplayground(app, 'Elasticplayground-CODE', {
	stack: 'playground',
	stage: 'CODE',
	env: {
		region: "eu-west-1",
		account: process.env.CDK_DEFAULT_ACCOUNT,
	}
});
