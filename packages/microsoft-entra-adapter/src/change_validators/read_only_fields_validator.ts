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
import { ChangeError, ChangeValidator, isModificationChange } from '@salto-io/adapter-api'
import { logger } from '@salto-io/logging'
import _ from 'lodash'
import { values } from '@salto-io/lowerdash'
import {
  APPLICATION_TYPE_NAME,
  CUSTOM_SECURITY_ATTRIBUTE_ALLOWED_VALUES_TYPE_NAME,
  CUSTOM_SECURITY_ATTRIBUTE_DEFINITION_TYPE_NAME,
  CUSTOM_SECURITY_ATTRIBUTE_SET_TYPE_NAME,
  DIRECTORY_ROLE_TYPE_NAME,
  DOMAIN_NAME_REFERENCES_FIELD_NAME,
  DOMAIN_TYPE_NAME,
  OAUTH2_PERMISSION_GRANT_TYPE_NAME,
  ROLE_DEFINITION_TYPE_NAME,
  SERVICE_PRINCIPAL_TYPE_NAME,
} from '../constants'

const log = logger(module)
const { isDefined } = values

export const TYPE_NAME_TO_READ_ONLY_FIELDS: Record<string, string[]> = {
  [ROLE_DEFINITION_TYPE_NAME]: ['inheritsPermissionsFrom'],
  [SERVICE_PRINCIPAL_TYPE_NAME]: ['appId', 'displayName'],
  [APPLICATION_TYPE_NAME]: ['appId', 'publisherDomain', 'applicationTemplateId'],
  [DIRECTORY_ROLE_TYPE_NAME]: ['description', 'displayName', 'roleTemplateId'],
  [OAUTH2_PERMISSION_GRANT_TYPE_NAME]: ['clientId', 'consentType', 'resourceId', 'principalId'],
  [CUSTOM_SECURITY_ATTRIBUTE_ALLOWED_VALUES_TYPE_NAME]: ['id'],
  [CUSTOM_SECURITY_ATTRIBUTE_DEFINITION_TYPE_NAME]: [
    'attributeSet',
    'isCollection',
    'isSearchable',
    'name',
    'type',
    'usePreDefinedValuesOnly',
  ],
  // The id field for the following types is not hidden, since it also indicates the name, and is used for creating new instances
  [CUSTOM_SECURITY_ATTRIBUTE_SET_TYPE_NAME]: ['id'],
  [DOMAIN_TYPE_NAME]: [DOMAIN_NAME_REFERENCES_FIELD_NAME, 'id'],
}

export const readOnlyFieldsValidator: ChangeValidator = async (changes, elementSource) => {
  if (elementSource === undefined) {
    log.warn(`elementSource is undefined, skipping ${readOnlyFieldsValidator.name}`)
    return []
  }
  const changesWithReadOnlyFields = changes
    .filter(isModificationChange)
    .filter(change => Object.keys(TYPE_NAME_TO_READ_ONLY_FIELDS).includes(change.data.after.elemID.typeName))

  return changesWithReadOnlyFields
    .map((change): ChangeError | undefined => {
      const readOnlyFields = TYPE_NAME_TO_READ_ONLY_FIELDS[change.data.after.elemID.typeName]
      const modifiedFields = readOnlyFields.filter(
        fieldName => _.get(change.data.before, fieldName) !== _.get(change.data.after, fieldName),
      )
      return _.isEmpty(modifiedFields)
        ? undefined
        : {
            elemID: change.data.after.elemID,
            severity: 'Warning',
            message: 'Read-only fields were modified',
            detailedMessage: `Instance ${change.data.after.elemID.name} has modified read-only fields: ${modifiedFields.join(', ')}. These changes will be ignored.`,
          }
    })
    .filter(isDefined)
}
