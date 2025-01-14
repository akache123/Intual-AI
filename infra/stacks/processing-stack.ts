import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import { isDevOrPreview } from "../common/shared";

export class ProcessingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const uploadsBucket = new s3.Bucket(this, "uploadsBucket", {
      removalPolicy: isDevOrPreview()
        ? cdk.RemovalPolicy.DESTROY
        : cdk.RemovalPolicy.RETAIN,
    });

    const processingQueue = new sqs.Queue(this, "processingQueue", {
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    // Create role for the API to publish messages to SQS & upload items to S3
    const apiAccessRole = new iam.Role(this, "apiAccessRole", {
      description: "Allow the API to access intual-processing components.",
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    apiAccessRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["sqs:SendMessage", "sqs:GetQueueAttributes"],
        resources: [processingQueue.queueArn],
      })
    );

    apiAccessRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:PutObject"],
        resources: [uploadsBucket.bucketArn, `${uploadsBucket.bucketArn}/*`],
      })
    );

    // Create role for `processing` to download items from S3 + receive & delete
    // SQS messages

    const processingAccessRole = new iam.Role(this, "processingAccessRole", {
      description:
        "Allow the processing service to access intual-processing components.",
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    processingAccessRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
        ],
        resources: [processingQueue.queueArn],
      })
    );

    processingAccessRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:GetObject", "s3:ListBucket"],
        resources: [uploadsBucket.bucketArn, `${uploadsBucket.bucketArn}/*`],
      })
    );

    // For development/preview environments, allow these roles to be assumed locally
    if (isDevOrPreview()) {
      for (let role of [apiAccessRole, processingAccessRole]) {
        role.assumeRolePolicy?.addStatements(
          new iam.PolicyStatement({
            actions: ["sts:AssumeRole"],
            principals: [new iam.AccountPrincipal(this.account)],
          })
        );
      }
    }

    new cdk.CfnOutput(this, "processingQueueUrl", {
      value: processingQueue.queueUrl,
      exportName: `${process.env.STAGE}-processingQueueUrl`,
    });

    new cdk.CfnOutput(this, "uploadsBucketName", {
      value: uploadsBucket.bucketName,
      exportName: `${process.env.STAGE}-uploadsBucketName`,
    });

    new cdk.CfnOutput(this, "apiAccessRoleArn", {
      value: apiAccessRole.roleArn,
      exportName: `${process.env.STAGE}-apiAccessRoleArn`,
    });

    new cdk.CfnOutput(this, "processingAccessRoleArn", {
      value: processingAccessRole.roleArn,
      exportName: `${process.env.STAGE}-processingAccessRoleArn`,
    });
  }
}
