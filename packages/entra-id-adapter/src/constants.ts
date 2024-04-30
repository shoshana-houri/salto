/*
 *                      Copyright 2024 Salto Labs Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
export const ADAPTER_NAME = 'entra_id'

// Fields
export const GROUP_APP_ROLE_ASSIGNMENT_FIELD_NAME = 'appRoleAssignments'
export const GROUP_LIFE_CYCLE_POLICY_FIELD_NAME = 'lifeCyclePolicies'

// Type names
export const GROUP_TYPE_NAME = 'group'
export const GROUP_APP_ROLE_ASSIGNMENT_TYPE_NAME = `${GROUP_TYPE_NAME}__${GROUP_APP_ROLE_ASSIGNMENT_FIELD_NAME}`
export const GROUP_LIFE_CYCLE_POLICY_TYPE_NAME = `${GROUP_TYPE_NAME}__${GROUP_LIFE_CYCLE_POLICY_FIELD_NAME}`
// As a direct fetch, not as the result the group
export const LIFE_CYCLE_POLICY_TYPE_NAME = 'groupLifeCyclePolicy'
export const CONDITIONAL_ACCESS_POLICY_TYPE_NAME = 'conditionalAccessPolicy'
export const APPLICATION_TYPE_NAME = 'application'
export const APP_ROLE_TYPE_NAME = 'appRole'
// Service Principal
export const SERVICE_PRINCIPAL_TYPE_NAME = 'servicePrincipal'
export const SERVICE_PRINCIPAL_APP_ROLE_ASSIGNMENT_TYPE_NAME = 'servicePrincipalAppRoleAssignment'
export const OAUTH2_PERMISSION_GRANT_TYPE_NAME = 'oauth2PermissionGrant'
export const DELEGATED_PERMISSION_CLASSIFICATION_TYPE_NAME = 'delegatedPermissionClassification'
export const SERVICE_PRINCIPAL_OWNER_TYPE_NAME = 'servicePrincipalOwner'
export const CLAIM_MAPPING_POLICY_TYPE_NAME = 'claimMappingPolicy'
export const HOME_REALM_DISCOVERY_POLICY_TYPE_NAME = 'homeRealmDiscoveryPolicy'
export const TOKEN_LIFETIME_POLICY_TYPE_NAME = 'tokenLifetimePolicy'
// Application
export const TOKEN_ISSUANCE_POLICY_TYPE_NAME = 'tokenIssuancePolicy'
// Custom Security Attribute Definition
export const CUSTOM_SECURITY_ATTRIBUTE_ALLOWED_VALUES_TYPE_NAME = 'customSecurityAttributeAllowedValues'
// Others
export const DIRECTORY_ROLE_TEMPLATE = 'directoryRoleTemplate'
