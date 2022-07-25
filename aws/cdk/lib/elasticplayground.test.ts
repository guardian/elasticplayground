import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Elasticplayground } from './elasticplayground';

describe('The Elasticplayground stack', () => {
	it('matches the snapshot', () => {
		const app = new App();
		const stack = new Elasticplayground(app, 'Elasticplayground', {
			stack: 'playground',
			stage: 'TEST',
		});
		const template = Template.fromStack(stack);
		expect(template.toJSON()).toMatchSnapshot();
	});
});
