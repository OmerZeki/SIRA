import { decrypt } from "@/lib/encrypt";
import { getPortalVaultDefinitionById, portalVaultDefinitions } from "@/lib/portal-vault";

export interface PortalCredentialRecord {
  username: string;
  password: string;
}

export function readPortalCredentialRecord(raw: string | null | undefined): PortalCredentialRecord {
  if (!raw) {
    return { username: "", password: "" };
  }

  try {
    const decrypted = JSON.parse(decrypt(raw));
    return {
      username: decrypted.username || "",
      password: decrypted.password || "",
    };
  } catch (error) {
    console.error("Failed to decrypt portal credentials", error);
    return { username: "", password: "" };
  }
}

export function getPortalCredentialsFromAgency(
  agency: Record<string, any> | null | undefined,
  portalId: string
): PortalCredentialRecord {
  const definition = getPortalVaultDefinitionById(portalId);
  if (!definition) {
    return { username: "", password: "" };
  }

  return readPortalCredentialRecord(agency?.[definition.agencyField]);
}

export function hasPortalCredentialsConfigured(
  agency: Record<string, any> | null | undefined,
  portalId: string
): boolean {
  const creds = getPortalCredentialsFromAgency(agency, portalId);
  return Boolean(creds.username && creds.password);
}

export function buildPortalCredentialsResponse(agency: Record<string, any> | null | undefined) {
  const response: Record<string, any> = {};

  for (const definition of portalVaultDefinitions) {
    const creds = readPortalCredentialRecord(agency?.[definition.agencyField]);
    response[`${definition.formKey}Username`] = creds.username;
    response[`${definition.formKey}PasswordConfigured`] = Boolean(creds.password);
  }

  return response;
}
