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
import { definitions, references as referenceUtils } from '@salto-io/adapter-components'
import {
  APP_ROLE_TYPE_NAME,
  DIRECTORY_ROLE_TEMPLATE,
  GROUP_LIFE_CYCLE_POLICY_TYPE_NAME,
  LIFE_CYCLE_POLICY_TYPE_NAME,
  SERVICE_PRINCIPAL_TYPE_NAME,
} from '../constants'
import { ReferenceContextStrategies, Options, CustomReferenceSerializationStrategyName } from './types'

const REFERENCE_RULES: referenceUtils.FieldReferenceDefinition<
  ReferenceContextStrategies,
  CustomReferenceSerializationStrategyName
>[] = [
  {
    src: { field: 'roleTemplateId' },
    target: { type: DIRECTORY_ROLE_TEMPLATE },
    serializationStrategy: 'id',
  },
  {
    src: { field: 'appRoleId' },
    target: { type: APP_ROLE_TYPE_NAME },
    serializationStrategy: 'id',
  },
  {
    src: { field: 'resourceId' },
    target: { type: SERVICE_PRINCIPAL_TYPE_NAME },
    serializationStrategy: 'id',
  },
  {
    src: { field: 'id', parentTypes: [GROUP_LIFE_CYCLE_POLICY_TYPE_NAME] },
    target: { type: LIFE_CYCLE_POLICY_TYPE_NAME },
    serializationStrategy: 'id',
  },
]

export const REFERENCES: definitions.ApiDefinitions<Options>['references'] = {
  rules: REFERENCE_RULES,
  fieldsToGroupBy: ['id', 'name'],
}
