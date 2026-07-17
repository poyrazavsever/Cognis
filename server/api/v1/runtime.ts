import "server-only";

import packageJson from "../../../package.json";
import { getPublicBranding } from "../../branding/runtime";
import { getServerConfig } from "../../config";
import { getInstanceService } from "../../instance/runtime";
import {
  buildDiscoveryDocument,
  buildInstanceMetadata,
} from "./contracts";

export function getNetaDiscoveryDocument() {
  return buildDiscoveryDocument(getContractInput());
}

export function getNetaInstanceMetadata() {
  return buildInstanceMetadata(getContractInput());
}

function getContractInput() {
  const config = getServerConfig();
  return {
    appUrl: config.appUrl,
    serverVersion: packageJson.version,
    minimumMobileClientVersion: config.minimumMobileClientVersion,
    identity: getInstanceService().getIdentity(),
    branding: getPublicBranding(),
  };
}
