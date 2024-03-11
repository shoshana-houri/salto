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
import { createStandardItemDeployConfigs } from './utils'
import { InstanceDeployApiDefinitions } from '../types'

export const DEPLOY_DEFINITIONS: Record<string, InstanceDeployApiDefinitions> = {
  space_permission: {
    requestsByAction: {
      customizations: {
        remove: [
          {
            request: {
              endpoint: {
                path: '/wiki/rest/api/space/{_parent.0.key}/permission/{id}',
                method: 'delete',
              },
            },
          },
        ],
      },
    },
  },
  page: {
    requestsByAction: {
      customizations: {
        add: [
          {
            request: {
              endpoint: {
                path: '/wiki/api/v2/pages',
                method: 'post',
              },
              transformation: {
                omit: ['restriction', 'version'],
              },
            },
          },
          {
            request: {
              endpoint: {
                path: '/wiki/rest/api/content/{id}/restriction',
                method: 'post',
              },
              transformation: {
                pick: ['restriction'],
                nestUnderField: 'results',
              },
            },
          },
        ],
        modify: [
          {
            request: {
              endpoint: {
                path: '/wiki/api/v2/pages/{id}',
                method: 'put',
              },
              transformation: {
                omit: ['restriction, version'],
              },
            },
          },
        ],
        remove: [
          {
            request: {
              endpoint: {
                path: '/wiki/api/v2/pages/{id}',
                method: 'delete',
              },
              transformation: {
                omit: ['restriction', 'version'],
              },
            },
          },
        ],
      },
    },
  },
  ..._.merge(
    createStandardItemDeployConfigs({
      space: { bulkPath: '/wiki/rest/api/space', idField: 'key' },
      blogpost: { bulkPath: 'wiki/api/v2/blogposts', idField: 'id' },
    }),
  ),
  // TODON add more examples including transformations, move utility functions to adapter-components
}
