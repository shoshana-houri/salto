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
import { definitions, deployment } from '@salto-io/adapter-components'
import { AdditionChange, InstanceElement, isAdditionChange, isRemovalChange } from '@salto-io/adapter-api'
import { values } from '@salto-io/lowerdash'
import { getParent } from '@salto-io/adapter-utils'
import {
  APPLICATION_TYPE_NAME,
  CONDITIONAL_ACCESS_POLICY_TYPE_NAME,
  GROUP_APP_ROLE_ASSIGNMENT_TYPE_NAME,
  GROUP_TYPE_NAME,
  SERVICE_PRINCIPAL_TYPE_NAME,
} from '../../constants'
import { AdditionalAction, ClientOptions } from '../types'

const { isPlainObject } = values

type InstanceDeployApiDefinitions = definitions.deploy.InstanceDeployApiDefinitions<AdditionalAction, ClientOptions>

const createCustomizations = (): Record<string, InstanceDeployApiDefinitions> => {
  const standardRequestDefinitions = deployment.helpers.createStandardDeployDefinitions<
    AdditionalAction,
    ClientOptions
  >({})
  const customDefinitions: Record<string, Partial<InstanceDeployApiDefinitions>> = {
    [CONDITIONAL_ACCESS_POLICY_TYPE_NAME]: {
      requestsByAction: {
        customizations: {
          add: [
            {
              request: {
                endpoint: {
                  path: '/identity/conditionalAccess/policies',
                  method: 'post',
                },
              },
            },
          ],
          remove: [
            {
              request: {
                endpoint: {
                  path: '/identity/conditionalAccess/policies/{id}',
                  method: 'delete',
                },
              },
            },
          ],
        },
      },
    },
    [APPLICATION_TYPE_NAME]: {
      requestsByAction: {
        customizations: {
          // TODO SVH: handle updating a logo
          add: [
            {
              request: {
                endpoint: {
                  path: '/applications',
                  method: 'post',
                },
                transformation: {
                  pick: ['displayName'],
                },
              },
              copyFromResponse: {
                toSharedContext: {
                  pick: ['id'],
                },
              },
            },
            {
              request: {
                endpoint: {
                  path: '/applications/{id}',
                  method: 'post',
                },
                transformation: {
                  omit: ['logo'],
                },
                context: {
                  sharedContext: {
                    id: 'id',
                  },
                },
              },
            },
            {
              request: {
                endpoint: {
                  path: '/applications/{id}/logo',
                  method: 'post',
                },
                transformation: {
                  pick: ['logo'],
                },
              },
              condition: {
                custom: () => input =>
                  (input.change as AdditionChange<InstanceElement>).data.after.value.logo !== undefined,
              },
            },
          ],
          remove: [
            {
              request: {
                endpoint: {
                  path: '/applications/{id}',
                  method: 'delete',
                },
              },
            },
          ],
        },
      },
    },
    [SERVICE_PRINCIPAL_TYPE_NAME]: {
      requestsByAction: {
        customizations: {
          add: [
            {
              request: {
                endpoint: {
                  path: '/servicePrincipals',
                  method: 'post',
                },
              },
            },
          ],
          remove: [
            {
              request: {
                endpoint: {
                  path: '/servicePrincipals/{id}',
                  method: 'delete',
                },
              },
            },
          ],
        },
      },
    },
    [GROUP_TYPE_NAME]: {
      requestsByAction: {
        customizations: {
          add: [
            {
              request: {
                endpoint: {
                  path: '/groups',
                  method: 'post',
                },
              },
            },
          ],
          modify: [
            {
              request: {
                endpoint: {
                  path: '/groups/{id}',
                  method: 'patch',
                },
              },
              condition: {
                transformForCheck: {
                  omit: ['appRoleAssignments'],
                },
              },
            },
          ],
          remove: [
            {
              request: {
                endpoint: {
                  path: '/groups/{id}',
                  method: 'delete',
                },
              },
            },
          ],
        },
      },
    },
    [GROUP_APP_ROLE_ASSIGNMENT_TYPE_NAME]: {
      requestsByAction: {
        customizations: {
          add: [
            {
              request: {
                endpoint: {
                  path: '/groups/{groupId}/appRoleAssignments',
                  method: 'post',
                },
                transformation: {
                  omit: ['id'],
                  adjust: item => {
                    if (!isPlainObject(item.value) || !isAdditionChange(item.context.change)) {
                      throw new Error('Unexpected value, expected a plain object')
                    }
                    return {
                      value: {
                        ...item.value,
                        principalId: getParent(item.context.change.data.after).value.id,
                      },
                    }
                  },
                },
                context: {
                  custom:
                    () =>
                    ({ change }) => {
                      if (!isAdditionChange(change)) {
                        throw new Error('Unexpected change, expected an addition change')
                      }
                      return {
                        groupId: getParent(change.data.after).value.id,
                      }
                    },
                },
              },
            },
          ],
          remove: [
            {
              request: {
                endpoint: {
                  path: '/groups/{groupId}/appRoleAssignments/{id}',
                  method: 'delete',
                },
                context: {
                  custom:
                    () =>
                    ({ change }) => {
                      if (!isRemovalChange(change)) {
                        throw new Error('Unexpected change, expected a removal change')
                      }
                      return {
                        groupId: getParent(change.data.before).value.id,
                      }
                    },
                },
              },
            },
          ],
        },
      },
    },
  }
  return _.merge(standardRequestDefinitions, customDefinitions)
}

export const createDeployDefinitions = (): definitions.deploy.DeployApiDefinitions<never, ClientOptions> => ({
  instances: {
    default: {
      requestsByAction: {
        default: {
          request: {
            context: deployment.helpers.DEFAULT_CONTEXT,
          },
        },
        customizations: {},
      },
      changeGroupId: deployment.grouping.selfGroup,
    },
    customizations: createCustomizations(),
  },
})
