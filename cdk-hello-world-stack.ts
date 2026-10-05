import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class CdkHelloWorldStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda
    const hello = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromInline(`
        exports.handler = async function(event) {
          return {
            statusCode: 200,
            body: 'Hello from Lambda!'
          };
        };
      `),
      handler: 'index.handler',
    });

    // S3 Bucket
    const bucket = new s3.Bucket(this, 'HelloBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Subir hola.txt automáticamente al bucket
    new s3deploy.BucketDeployment(this, 'DeployHelloFile', {
      sources: [
        s3deploy.Source.asset('./assets'),
      ],
      destinationBucket: bucket,
    });
  }
}
