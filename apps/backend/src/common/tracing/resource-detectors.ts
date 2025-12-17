import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { BUILD_INFO } from "../../build-info";

/**
 * Create OTEL resource with service metadata
 */
export function createResource(): Resource {
  const serviceName = process.env.OTEL_SERVICE_NAME || "vcecom-backend";
  const serviceVersion = BUILD_INFO.version || "0.0.1";
  const deploymentEnvironment = process.env.NODE_ENV || "development";
  const region = process.env.DEPLOYMENT_REGION || "fra1";

  return new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: deploymentEnvironment,
    [SemanticResourceAttributes.CLOUD_REGION]: region,
  });
}
