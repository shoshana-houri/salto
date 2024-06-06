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
import { isAdditionChange } from '@salto-io/adapter-api'
import { validatePlainObject } from '../../type-validators'
import { DeployCustomDefinitions, EndpointPath } from '../types'

export const createDefinitionForAppRoleAssignment = (
  parentResourceName: string,
  typeName: string,
): DeployCustomDefinitions => ({
  [typeName]: {
    requestsByAction: {
      customizations: {
        add: [
          {
            request: {
              endpoint: {
                path: `/${parentResourceName}/{parent_id}/appRoleAssignments` as EndpointPath,
                method: 'post',
              },
              transformation: {
                omit: ['id'],
                adjust: item => {
                  validatePlainObject(item.value, typeName)
                  if (!isAdditionChange(item.context.change)) {
                    throw new Error('Unexpected value, expected a plain object')
                  }
                  const parentId = _.get(item.context, 'additionalContext.parent_id')
                  if (parentId === undefined) {
                    throw new Error(`Missing parent_id in context, cannot add ${typeName} without a parent_id`)
                  }
                  return {
                    value: {
                      ...item.value,
                      principalId: parentId,
                    },
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
                path: `/${parentResourceName}/{parent_id}/appRoleAssignments/{id}` as EndpointPath,
                method: 'delete',
              },
            },
          },
        ],
      },
    },
  },
})
