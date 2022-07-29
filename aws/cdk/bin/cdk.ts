import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { Elasticplayground } from '../lib/elasticplayground';
import {EksPrerequisites} from "../lib/prerequisites";

const app = new App();
new EksPrerequisites(app, "Elasticplayground-prereqs");

new Elasticplayground(app, 'Elasticplayground-CODE', {
	stack: 'playground',
	stage: 'CODE',
	env: {
		region: "eu-west-1",
		account: process.env.CDK_DEFAULT_ACCOUNT,
	}
});
