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

import { createCustomizationsWithBasePathForFetch } from '../../../../src/definitions/fetch/entra/utils'
import { FetchCustomizations } from '../../../../src/definitions/fetch/shared/types'

describe(`${createCustomizationsWithBasePathForFetch.name}`, () => {
  it('should return the correct customizations', () => {
    const customizations: FetchCustomizations = {
      a: {
        requests: [
          {
            endpoint: {
              path: '/path',
            },
          },
        ],
      },
    }
    const basePath = '/base'
    const result = createCustomizationsWithBasePathForFetch(customizations, basePath)
    expect(result).toEqual({
      a: {
        requests: [
          {
            endpoint: {
              path: '/base/path',
            },
          },
        ],
      },
    })
  })
})
