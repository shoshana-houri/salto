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
import { InstanceFetchApiDefinitions } from '../types'

export const FETCH_DEFINITIONS: Record<string, InstanceFetchApiDefinitions> = {
  group: {
    requests: [
      {
        endpoint: {
          path: '/wiki/rest/api/group',
        },
        transformation: {
          root: 'results',
        },
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
  label: {
    requests: [
      {
        endpoint: {
          path: '/wiki/rest/api/label',
        },
        transformation: {
          root: 'results',
        },
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
  system_info: {
    requests: [
      {
        endpoint: {
          path: '/wiki/rest/settings/systemInfo',
        },
        transformation: {
          root: 'results',
        },
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
  space: {
    requests: [
      {
        endpoint: {
          path: '/wiki/rest/api/space',
        },
        transformation: {
          root: 'results',
        },
      },
    ],
    resource: {
      directFetch: true,
      recurseInto: {
        permissions: {
          typeName: 'permission',
          context: {
            args: {
              id: {
                fromField: 'id',
              },
            },
          },
        },
      },
    },
    element: {
      topLevel: {
        isTopLevel: true,
        path: {
          pathParts: [
            {
              parts: [{ fieldName: 'name' }],
            },
            {
              parts: [{ fieldName: 'name' }],
            },
          ],
        },
      },
      fieldCustomizations: {
        properties: {
          standalone: {
            typeName: 'space_property',
            addParentAnnotation: true,
            referenceFromParent: true,
            nestPathUnderParent: true,
          },
        },
      },
    },
  },
  permission: {
    requests: [
      {
        endpoint: {
          path: '/wiki/api/v2/spaces/{id}/permissions',
        },
        transformation: {
          root: 'results',
        },
      },
    ],
  },
  space_property: {
    requests: [
      {
        endpoint: {
          path: '/wiki/api/v2/spaces/{id}/properties',
        },
        transformation: {
          root: 'results',
        },
      },
    ],
    element: {
      topLevel: {
        isTopLevel: true,
      },
    },
  },
  template_page: {
    requests: [
      {
        endpoint: {
          path: '/wiki/rest/api/template/page',
        },
        transformation: {
          root: 'results',
        },
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
  page: {
    requests: [
      {
        endpoint: {
          path: '/wiki/api/v2/pages',
        },
        transformation: {
          root: 'results',
        },
      },
    ],
    resource: {
      directFetch: true,
      recurseInto: {
        restriction: {
          typeName: 'restriction',
          context: {
            args: {
              id: {
                fromField: 'id',
              },
            },
          },
        },
      },
    },
    element: {
      topLevel: {
        isTopLevel: true,
        serviceUrl: {
          path: '/wiki/spaces/{spaceId.key}/pages/{id}',
        },
        elemID: {
          // Confluence does not allow pages with the same title in the same space
          parts: [{ fieldName: 'spaceId', isReference: true }, { fieldName: 'title' }],
        },
        path: {
          pathParts: [
            {
              parts: [{ fieldName: 'spaceId', isReference: true }],
            },
            {
              parts: [{ fieldName: 'title' }],
            },
          ],
        },
      },
    },
  },
  settings: {
    requests: [
      {
        endpoint: {
          path: '/wiki/rest/api/settings/lookandfeel',
        },
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
        singleton: true,
      },
      fieldCustomizations: {
        global: {
          standalone: {
            typeName: 'settings_global',
            addParentAnnotation: false,
            referenceFromParent: false,
            nestPathUnderParent: false,
          },
        },
        custom: {
          standalone: {
            typeName: 'settings_custom',
            addParentAnnotation: false,
            referenceFromParent: false,
            nestPathUnderParent: false,
          },
        },
      },
    },
  },
  settings_global: {
    element: {
      topLevel: {
        isTopLevel: true,
        singleton: true,
      },
    },
  },
  settings_custom: {
    element: {
      topLevel: {
        isTopLevel: true,
        singleton: true,
      },
    },
  },
  blogpost: {
    requests: [
      {
        endpoint: {
          path: '/wiki/api/v2/blogposts',
        },
        transformation: {
          root: 'results',
        },
      },
    ],
    resource: {
      directFetch: true,
    },
    element: {
      topLevel: {
        isTopLevel: true,
        elemID: {
          parts: [{ fieldName: 'title' }],
        },
      },
    },
  },
  restriction: {
    requests: [
      {
        endpoint: {
          path: '/wiki/rest/api/content/{id}/restriction',
        },
        transformation: {
          root: 'results',
          adjust: item => ({
            value: {
              operation: _.get(item.value, 'operation'),
              restrictions: {
                user: _.get(item.value, 'restrictions.user.results'),
                group: _.get(item.value, 'restrictions.group.results'),
              },
            },
          }),
        },
      },
    ],
  },
}
