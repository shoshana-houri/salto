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
import { SaltoError } from '@salto-io/adapter-api'
import { types } from '@salto-io/lowerdash'
import { ContextCombinationDefinition, RecurseIntoDefinition } from './dependencies'
import { AdjustFunction, GeneratedItem, TransformDefinition } from '../shared'
import { ConfigChangeSuggestion } from '../../user'

export type ResourceTransformFunc = AdjustFunction<{ fragments: GeneratedItem[] }>

type FailEntireFetch = {
  // If set to true, the entire fetch will fail if an error is encountered while fetching this resource.
  // By default - false, meaning the fetch will log the error and continue, with only this resource missing.
  failEntireFetch: boolean
}

type CustomSaltoError = {
  customSaltoError: SaltoError
}

type ConfigSuggestion = {
  configSuggestion: ConfigChangeSuggestion
}

type OnErrorHandler = (e: Error) => types.XOR<types.XOR<FailEntireFetch, CustomSaltoError>, ConfigSuggestion>

export type FetchResourceDefinition = {
  // set to true if the resource should be fetched on its own. set to false for types only fetched via recurseInto
  directFetch: boolean

  // fields used to uniquely identify this entity in the service. usually the (internal) id can be used
  serviceIDFields?: string[]

  // context arg name to type info
  // no need to specify context received from a parent's recurseInto context
  context?: ContextCombinationDefinition

  // target field name to sub-resource info
  // can be used to add nested fields containing other fetched types' responses (after the response was received),
  // and to separate child resources into their own instances
  recurseInto?: Record<string, RecurseIntoDefinition>

  // construct the final value from all fetched fragments, which are grouped by the service id
  // default behavior: merge all fragments together while concatenating array values.
  // note: on overlaps the latest fragment wins ??
  // note: concatenation order between fragments is not defined.
  mergeAndTransform?: TransformDefinition<{ fragments: GeneratedItem[] }>

  // Error handler for a specific resource.
  // The error handler receives the error that was thrown during the fetch and can return exactly
  // one of the following: FailEntireFetch, CustomSaltoError, ConfigSuggestion.
  // By default, any error thrown during the fetch is treated as if FailEntireFetch was set to false.
  onError?: OnErrorHandler
}
