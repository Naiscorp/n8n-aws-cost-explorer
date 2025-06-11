import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AwsCostExplorerApi implements ICredentialType {
	name = 'awsCostExplorerApi';
	displayName = 'AWS Cost Explorer API';
	documentationUrl = 'https://docs.aws.amazon.com/cost-explorer/';
	properties: INodeProperties[] = [
		{
			displayName: 'AWS Access Key ID',
			name: 'accessKeyId',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'AWS Secret Access Key',
			name: 'secretAccessKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
		},
		{
			displayName: 'Region',
			name: 'region',
			type: 'string',
			default: 'us-east-1',
			required: true,
			description: 'AWS region where Cost Explorer API is available',
		},
	];
} 