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
import _ from 'lodash'
import { definitions } from '@salto-io/adapter-components'
import { UserFetchConfig } from '../../config'
import { Options } from '../types'
import {
  SERVICE_PRINCIPAL_APP_ROLE_ASSIGNMENT_TYPE_NAME,
  CLAIM_MAPPING_POLICY_TYPE_NAME,
  CUSTOM_SECURITY_ATTRIBUTE_ALLOWED_VALUES_TYPE_NAME,
  DELEGATED_PERMISSION_CLASSIFICATION_TYPE_NAME,
  DIRECTORY_ROLE_TEMPLATE,
  GROUP_APP_ROLE_ASSIGNMENT_TYPE_NAME,
  HOME_REALM_DISCOVERY_POLICY_TYPE_NAME,
  OAUTH2_PERMISSION_GRANT_TYPE_NAME,
  SERVICE_PRINCIPAL_OWNER_TYPE_NAME,
  TOKEN_ISSUANCE_POLICY_TYPE_NAME,
  TOKEN_LIFETIME_POLICY_TYPE_NAME,
  SERVICE_PRINCIPAL_TYPE_NAME,
  CONDITIONAL_ACCESS_POLICY_TYPE_NAME,
  APPLICATION_TYPE_NAME,
  GROUP_TYPE_NAME,
  APP_ROLE_TYPE_NAME,
  GROUP_APP_ROLE_ASSIGNMENT_FIELD_NAME,
  GROUP_LIFE_CYCLE_POLICY_FIELD_NAME,
  GROUP_LIFE_CYCLE_POLICY_TYPE_NAME,
  LIFE_CYCLE_POLICY_TYPE_NAME,
} from '../../constants'

const DEFAULT_FIELDS_TO_HIDE: Record<string, definitions.fetch.ElementFieldCustomization> = {
  created_at: {
    hide: true,
  },
  updated_at: {
    hide: true,
  },
  created_by_id: {
    hide: true,
  },
  updated_by_id: {
    hide: true,
  },
}
const ID_FIELD_TO_HIDE = { id: { hide: true } }
const DEFAULT_FIELDS_TO_OMIT: Record<string, definitions.fetch.ElementFieldCustomization> = {
  _links: {
    omit: true,
  },
  createdDateTime: {
    omit: true,
  },
  renewedDateTime: {
    omit: true,
  },
  '@odata.type': {
    omit: true,
  },
}

const NAME_ID_FIELD: definitions.fetch.FieldIDPart = { fieldName: 'displayName' }
const DEFAULT_ID_PARTS = [NAME_ID_FIELD]

const DEFAULT_FIELD_CUSTOMIZATIONS: Record<string, definitions.fetch.ElementFieldCustomization> = _.merge(
  {},
  DEFAULT_FIELDS_TO_HIDE,
  DEFAULT_FIELDS_TO_OMIT,
)

const DEFAULT_TRANSFORMATION = { root: 'value' }

const createCustomizations = (): Record<string, definitions.fetch.InstanceFetchApiDefinitions<Options>> => ({
  [GROUP_TYPE_NAME]: {
    requests: [
      {
        endpoint: {
          path: '/groups?$select=*,expirationDateTime',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    resource: {
      directFetch: true,
      recurseInto: {
        [GROUP_APP_ROLE_ASSIGNMENT_FIELD_NAME]: {
          typeName: GROUP_APP_ROLE_ASSIGNMENT_TYPE_NAME,
          context: {
            args: {
              id: {
                root: 'id',
              },
            },
          },
        },
        [GROUP_LIFE_CYCLE_POLICY_FIELD_NAME]: {
          typeName: GROUP_LIFE_CYCLE_POLICY_TYPE_NAME,
          context: {
            args: {
              id: {
                root: 'id',
              },
            },
          },
        },
      },
    },
    element: {
      topLevel: {
        isTopLevel: true,
      },
      fieldCustomizations: {
        ...ID_FIELD_TO_HIDE,
        [GROUP_APP_ROLE_ASSIGNMENT_FIELD_NAME]: {
          standalone: {
            typeName: GROUP_APP_ROLE_ASSIGNMENT_TYPE_NAME,
            addParentAnnotation: true,
            nestPathUnderParent: true,
            referenceFromParent: true,
          },
        },
      },
    },
  },
  [GROUP_APP_ROLE_ASSIGNMENT_TYPE_NAME]: {
    requests: [
      {
        endpoint: {
          path: '/groups/{id}/appRoleAssignments',
        },
        transformation: {
          ...DEFAULT_TRANSFORMATION,
          pick: ['id', 'appRoleId', 'resourceId'],
        },
      },
    ],
    element: {
      topLevel: {
        isTopLevel: true,
        elemID: {
          parts: [
            { fieldName: 'appRoleId', isReference: true },
            { fieldName: 'resourceId', isReference: true },
          ],
        },
      },
      fieldCustomizations: {
        ...ID_FIELD_TO_HIDE,
      },
    },
  },
  // TODO SVH: transform from array of objects to array of values
  [GROUP_LIFE_CYCLE_POLICY_TYPE_NAME]: {
    requests: [
      {
        endpoint: {
          path: '/groups/{id}/groupLifecyclePolicies',
        },
        transformation: {
          ...DEFAULT_TRANSFORMATION,
          pick: ['id'],
        },
      },
    ],
    resource: {
      directFetch: false,
    },
  },
  [LIFE_CYCLE_POLICY_TYPE_NAME]: {
    requests: [
      {
        endpoint: {
          path: '/groupLifecyclePolicies',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
      },
    },
  },
  [APPLICATION_TYPE_NAME]: {
    requests: [
      {
        endpoint: {
          path: '/applications',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    resource: {
      directFetch: true,
      recurseInto: {
        tokenIssuancePolicies: {
          typeName: TOKEN_ISSUANCE_POLICY_TYPE_NAME,
          context: {
            args: {
              id: {
                root: 'id',
              },
            },
          },
        },
      },
    },
    element: {
      topLevel: {
        isTopLevel: true,
      },
      fieldCustomizations: {
        appRoles: {
          standalone: {
            typeName: APP_ROLE_TYPE_NAME,
            addParentAnnotation: true,
            nestPathUnderParent: true,
            referenceFromParent: true,
          },
        },
      },
    },
  },
  [APP_ROLE_TYPE_NAME]: {
    element: {
      topLevel: {
        isTopLevel: true,
        elemID: {
          extendsParent: true,
        },
      },
      fieldCustomizations: {
        ...ID_FIELD_TO_HIDE,
      },
    },
  },
  [TOKEN_ISSUANCE_POLICY_TYPE_NAME]: {
    requests: [
      {
        endpoint: {
          path: '/applications/{id}/tokenIssuancePolicies',
        },
        // transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    element: {
      topLevel: {
        isTopLevel: true,
        elemID: {
          extendsParent: true,
        },
      },
    },
  },
  [SERVICE_PRINCIPAL_TYPE_NAME]: {
    requests: [
      {
        endpoint: {
          path: '/servicePrincipals',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    resource: {
      directFetch: true,
      recurseInto: {
        appRoleAssignments: {
          typeName: SERVICE_PRINCIPAL_APP_ROLE_ASSIGNMENT_TYPE_NAME,
          context: {
            args: {
              id: {
                root: 'id',
              },
            },
          },
        },
        oauth2PermissionGrants: {
          typeName: OAUTH2_PERMISSION_GRANT_TYPE_NAME,
          context: {
            args: {
              id: {
                root: 'id',
              },
            },
          },
        },
        delegatedPermissionClassifications: {
          typeName: DELEGATED_PERMISSION_CLASSIFICATION_TYPE_NAME,
          context: {
            args: {
              id: {
                root: 'id',
              },
            },
          },
        },
        owners: {
          typeName: SERVICE_PRINCIPAL_OWNER_TYPE_NAME,
          context: {
            args: {
              id: {
                root: 'id',
              },
            },
          },
        },
        claimMappingPolicies: {
          typeName: CLAIM_MAPPING_POLICY_TYPE_NAME,
          context: {
            args: {
              id: {
                root: 'id',
              },
            },
          },
        },
        homeRealmDiscoveryPolicies: {
          typeName: HOME_REALM_DISCOVERY_POLICY_TYPE_NAME,
          context: {
            args: {
              id: {
                root: 'id',
              },
            },
          },
        },
        tokenLifetimePolicies: {
          typeName: TOKEN_LIFETIME_POLICY_TYPE_NAME,
          context: {
            args: {
              id: {
                root: 'id',
              },
            },
          },
        },
      },
    },
    element: {
      topLevel: {
        isTopLevel: true,
      },
    },
  },
  [SERVICE_PRINCIPAL_APP_ROLE_ASSIGNMENT_TYPE_NAME]: {
    requests: [
      {
        endpoint: {
          path: '/servicePrincipals/{id}/appRoleAssignments',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    element: {
      topLevel: {
        isTopLevel: true,
        elemID: {
          extendsParent: true,
        },
      },
    },
  },
  [OAUTH2_PERMISSION_GRANT_TYPE_NAME]: {
    requests: [
      {
        endpoint: {
          path: '/servicePrincipals/{id}/oauth2PermissionGrants',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    element: {
      topLevel: {
        isTopLevel: true,
        elemID: {
          extendsParent: true,
        },
      },
    },
  },
  [DELEGATED_PERMISSION_CLASSIFICATION_TYPE_NAME]: {
    requests: [
      {
        endpoint: {
          path: '/servicePrincipals/{id}/delegatedPermissionClassifications',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    element: {
      topLevel: {
        isTopLevel: true,
        elemID: {
          extendsParent: true,
        },
      },
    },
  },
  [SERVICE_PRINCIPAL_OWNER_TYPE_NAME]: {
    requests: [
      {
        endpoint: {
          path: '/servicePrincipals/{id}/owners',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    resource: {
      directFetch: false,
      // TODO SVH: add recurse into to fetch only these users?
    },
  },
  [CLAIM_MAPPING_POLICY_TYPE_NAME]: {
    requests: [
      {
        endpoint: {
          path: '/servicePrincipals/{id}/claimsMappingPolicies',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    element: {
      topLevel: {
        isTopLevel: true,
        elemID: {
          extendsParent: true,
        },
      },
    },
  },
  [HOME_REALM_DISCOVERY_POLICY_TYPE_NAME]: {
    requests: [
      {
        endpoint: {
          path: '/servicePrincipals/{id}/homeRealmDiscoveryPolicies',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    element: {
      topLevel: {
        isTopLevel: true,
        elemID: {
          extendsParent: true,
        },
      },
    },
  },
  [TOKEN_LIFETIME_POLICY_TYPE_NAME]: {
    requests: [
      {
        endpoint: {
          path: '/servicePrincipals/{id}/tokenLifetimePolicies',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    element: {
      topLevel: {
        isTopLevel: true,
        elemID: {
          extendsParent: true,
        },
      },
    },
  },
  permissionGrantPolicy: {
    requests: [
      {
        endpoint: {
          path: '/policies/permissionGrantPolicies',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
        elemID: {
          parts: [{ fieldName: 'displayName' }],
        },
      },
    },
  },
  user: {
    requests: [
      {
        endpoint: {
          path: '/users',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
        elemID: {
          parts: [{ fieldName: 'displayName' }],
        },
      },
    },
  },
  administrativeUnit: {
    requests: [
      {
        endpoint: {
          path: '/directory/administrativeUnits',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
        elemID: {
          parts: [{ fieldName: 'displayName' }],
        },
      },
      fieldCustomizations: {
        ...ID_FIELD_TO_HIDE,
      },
    },
  },
  [CONDITIONAL_ACCESS_POLICY_TYPE_NAME]: {
    requests: [
      {
        endpoint: {
          path: '/identity/conditionalAccess/policies',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
        elemID: {
          parts: [{ fieldName: 'displayName' }],
        },
      },
    },
  },
  // TODO SVH: is the default one marked? is it returned by default?
  // https://learn.microsoft.com/en-us/graph/api/crosstenantaccesspolicyconfigurationdefault-get?view=graph-rest-1.0&tabs=http
  // Same for partner settings
  // https://learn.microsoft.com/en-us/graph/api/crosstenantidentitysyncpolicypartner-get?view=graph-rest-1.0&tabs=http
  crossTenantAccessPolicy: {
    requests: [
      {
        endpoint: {
          path: '/policies/crossTenantAccessPolicy',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
      },
    },
  },
  customSecurityAttributeDefinition: {
    requests: [
      {
        endpoint: {
          path: '/directory/customSecurityAttributeDefinitions',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    resource: {
      directFetch: true,
      recurseInto: {
        allowedValues: {
          typeName: CUSTOM_SECURITY_ATTRIBUTE_ALLOWED_VALUES_TYPE_NAME,
          context: {
            args: {
              id: {
                root: 'id',
              },
            },
          },
        },
      },
    },
    element: {
      topLevel: {
        isTopLevel: true,
      },
    },
  },
  [CUSTOM_SECURITY_ATTRIBUTE_ALLOWED_VALUES_TYPE_NAME]: {
    requests: [
      {
        endpoint: {
          path: '/directory/customSecurityAttributeDefinitions/{id}/allowedValues',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
  },
  device: {
    requests: [
      {
        endpoint: {
          path: '/devices',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
        elemID: {
          parts: [{ fieldName: 'displayName' }],
        },
      },
    },
  },
  roleDefinition: {
    requests: [
      {
        endpoint: {
          path: '/roleManagement/directory/roleDefinitions',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
        elemID: {
          parts: [{ fieldName: 'displayName' }],
        },
      },
    },
  },
  [DIRECTORY_ROLE_TEMPLATE]: {
    requests: [
      {
        endpoint: {
          path: '/directoryRoleTemplates',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
        elemID: {
          parts: [{ fieldName: 'displayName' }],
        },
      },
    },
  },
  directoryRole: {
    requests: [
      {
        endpoint: {
          path: '/directoryRoles',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
        elemID: {
          parts: [{ fieldName: 'displayName' }],
        },
      },
    },
  },
  domain: {
    requests: [
      {
        endpoint: {
          path: '/domains',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
        elemID: {
          parts: [{ fieldName: 'id' }],
        },
      },
    },
  },

  // Authentication
  authenticationMethod: {
    requests: [
      {
        endpoint: {
          path: '/me/authentication/methods',
        },
        transformation: DEFAULT_TRANSFORMATION,
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
      },
    },
  },
  emailAuthenticationMethod: {
    requests: [
      {
        endpoint: {
          path: '/me/authentication/emailMethods',
        },
        // transformation: {
        //   root: 'value',
        // },
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
      },
    },
  },
  fido2AuthenticationMethod: {
    requests: [
      {
        endpoint: {
          path: '/me/authentication/fido2Methods',
        },
        // transformation: {
        //   root: 'value',
        // },
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
      },
    },
  },
  microsoftAuthenticatorAuthenticationMethod: {
    requests: [
      {
        endpoint: {
          path: '/me/authentication/microsoftAuthenticatorMethods',
        },
        // transformation: {
        //   root: 'value',
        // },
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
      },
    },
  },
  passwordAuthenticationMethod: {
    requests: [
      {
        endpoint: {
          path: '/me/authentication/passwordMethods',
        },
        // transformation: {
        //   root: 'value',
        // },
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
      },
    },
  },
  phoneAuthenticationMethod: {
    requests: [
      {
        endpoint: {
          path: '/me/authentication/phoneMethods',
        },
        // transformation: {
        //   root: 'value',
        // },
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
      },
    },
  },
  softwareOathAuthenticationMethod: {
    requests: [
      {
        endpoint: {
          path: '/me/authentication/softwareOathMethods',
        },
        // transformation: {
        //   root: 'value',
        // },
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
      },
    },
  },
  temporaryAccessPassAuthenticationMethod: {
    requests: [
      {
        endpoint: {
          path: '/me/authentication/temporaryAccessPassMethods',
        },
        // transformation: {
        //   root: 'value',
        // },
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
      },
    },
  },
  windowsHelloForBusinessAuthenticationMethod: {
    requests: [
      {
        endpoint: {
          path: '/me/authentication/windowsHelloForBusinessMethods',
        },
        // transformation: {
        //   root: 'value',
        // },
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
      },
    },
  },
  authenticationStrengthPolicy: {
    requests: [
      {
        endpoint: {
          path: '/policies/authenticationStrengthPolicies',
        },
        // transformation: {
        //   root: 'value',
        // },
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
      },
    },
  },
})

export const createFetchDefinitions = (
  _fetchConfig: UserFetchConfig,
): definitions.fetch.FetchApiDefinitions<Options> => ({
  instances: {
    default: {
      resource: {
        serviceIDFields: ['id'],
      },
      element: {
        topLevel: {
          elemID: { parts: DEFAULT_ID_PARTS },
          serviceUrl: {
            // TODO put default base url for serviceUrl filter (can override for specific types in customizations)
            baseUrl: 'https://api.example.com',
          },
        },
        fieldCustomizations: DEFAULT_FIELD_CUSTOMIZATIONS,
      },
    },
    customizations: createCustomizations(),
  },
})
