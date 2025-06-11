import {
	IExecuteFunctions,
} from 'n8n-core';

import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { CostExplorerClient, GetCostAndUsageCommand, GetDimensionValuesCommand } from '@aws-sdk/client-cost-explorer';

export class AwsCostExplorer implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AWS Cost Explorer',
		name: 'awsCostExplorer',
		icon: 'file:awscostexplorer.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Get cost and usage data from AWS Cost Explorer',
		defaults: {
			name: 'AWS Cost Explorer',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'awsCostExplorerApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Cost and Usage',
						value: 'costAndUsage',
					},
					{
						name: 'Dimension Values',
						value: 'dimensionValues',
					},
				],
				default: 'costAndUsage',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [
							'costAndUsage',
						],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get cost and usage data',
						action: 'Get cost and usage data',
					},
				],
				default: 'get',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [
							'dimensionValues',
						],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get dimension values',
						action: 'Get dimension values',
					},
				],
				default: 'get',
			},
			// Cost and Usage parameters
			{
				displayName: 'Start Date',
				name: 'startDate',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['costAndUsage'],
						operation: ['get'],
					},
				},
				default: '',
				placeholder: '2023-01-01',
				description: 'Start date in YYYY-MM-DD format',
				required: true,
			},
			{
				displayName: 'End Date',
				name: 'endDate',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['costAndUsage'],
						operation: ['get'],
					},
				},
				default: '',
				placeholder: '2023-01-31',
				description: 'End date in YYYY-MM-DD format',
				required: true,
			},
			{
				displayName: 'Granularity',
				name: 'granularity',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['costAndUsage'],
						operation: ['get'],
					},
				},
				options: [
					{
						name: 'Daily',
						value: 'DAILY',
					},
					{
						name: 'Monthly',
						value: 'MONTHLY',
					},
					{
						name: 'Hourly',
						value: 'HOURLY',
					},
				],
				default: 'MONTHLY',
			},
			{
				displayName: 'Metrics',
				name: 'metrics',
				type: 'multiOptions',
				displayOptions: {
					show: {
						resource: ['costAndUsage'],
						operation: ['get'],
					},
				},
				options: [
					{
						name: 'Blended Cost',
						value: 'BlendedCost',
					},
					{
						name: 'Unblended Cost',
						value: 'UnblendedCost',
					},
					{
						name: 'Usage Quantity',
						value: 'UsageQuantity',
					},
				],
				default: ['UnblendedCost'],
			},
			// Dimension Values parameters
			{
				displayName: 'Dimension',
				name: 'dimension',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['dimensionValues'],
						operation: ['get'],
					},
				},
				options: [
					{
						name: 'Service',
						value: 'SERVICE',
					},
					{
						name: 'Linked Account',
						value: 'LINKED_ACCOUNT',
					},
					{
						name: 'Instance Type',
						value: 'INSTANCE_TYPE',
					},
					{
						name: 'Region',
						value: 'REGION',
					},
				],
				default: 'SERVICE',
				required: true,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const length = items.length;

		const credentials = await this.getCredentials('awsCostExplorerApi');

		const client = new CostExplorerClient({
			region: credentials.region as string,
			credentials: {
				accessKeyId: credentials.accessKeyId as string,
				secretAccessKey: credentials.secretAccessKey as string,
			},
		});

		for (let i = 0; i < length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'costAndUsage') {
					if (operation === 'get') {
						const startDate = this.getNodeParameter('startDate', i) as string;
						const endDate = this.getNodeParameter('endDate', i) as string;
						const granularity = this.getNodeParameter('granularity', i) as string;
						const metrics = this.getNodeParameter('metrics', i) as string[];

						const command = new GetCostAndUsageCommand({
							TimePeriod: {
								Start: startDate,
								End: endDate,
							},
							Granularity: granularity,
							Metrics: metrics,
						});

						const response = await client.send(command);
						returnData.push(response as unknown as IDataObject);
					}
				}

				if (resource === 'dimensionValues') {
					if (operation === 'get') {
						const dimension = this.getNodeParameter('dimension', i) as string;

						const command = new GetDimensionValuesCommand({
							TimePeriod: {
								Start: '2023-01-01',
								End: '2023-12-31',
							},
							Dimension: dimension,
						});

						const response = await client.send(command);
						returnData.push(response as unknown as IDataObject);
					}
				}

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: error.message });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error);
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
} 